from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from io import BytesIO
import json
from pathlib import Path
import time
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import WorkerSettings, get_worker_settings
from app.db.session import new_session
from app.services.job_candidate_normalizer import normalize_candidate
from app.services.job_ai_filter import apply_decision, evaluate_ai_filter, normalize_ai_filter_settings, openai_ai_filter_provider
from app.services.linkedin_candidate_parser import parse_candidate
from app.services.linkedin_search_provider import DEFAULT_HIRING_INTENT_TERMS, collect_candidates
from app.services.job_review_analyzer import analyze_candidate, flatten_review_profile

TERMINAL_FAILURE_STATUSES = {"blocked", "inaccessible", "empty", "failed"}
REJECTED_OUTCOMES = {
    "rejected_no_contact",
    "rejected_weak_match",
    "rejected_missing_evidence",
    "failed_provider",
    "blocked_source",
    "inaccessible_source",
    "empty_source",
    "rejected_ai_filter",
    "failed_ai_filter",
}


def new_id() -> str:
    return str(uuid4())


def json_list(value: object, fallback: list[str] | None = None) -> list[str]:
    if value is None:
        return list(fallback or [])
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return list(fallback or [])
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    return list(fallback or [])


def truncate_string(value: object, max_length: int) -> str | None:
    text_value = str(value or "").strip()
    if not text_value:
        return None
    return text_value[:max_length]


def normalize_key_part(value: str) -> str:
    return " ".join(value.lower().strip().split())


def build_job_dedupe_key(candidate: dict[str, object]) -> str:
    title = str(candidate.get("role_title") or candidate.get("post_headline") or "")
    keywords = sorted({normalize_key_part(str(keyword)) for keyword in candidate.get("matched_keywords", []) if keyword})
    company = normalize_key_part(str(candidate.get("company_name") or ""))
    normalized_title = normalize_key_part(title)
    parts = [
        company,
        normalized_title,
        ",".join(keywords),
        normalize_key_part(str(candidate.get("contact_channel_value") or "")),
    ]
    if not company and not normalized_title:
        parts.append(normalize_key_part(str(candidate.get("source_url") or "")))
    return "|".join(parts)


def inspect_candidates(
    raw_candidates: list[dict[str, object]],
    requested_keywords: list[str],
    limit: int | None = None,
) -> list[dict[str, object]]:
    inspected = []
    selected_candidates = raw_candidates if limit is None else raw_candidates[:limit]
    for raw in selected_candidates:
        parsed = parse_candidate(raw, requested_keywords)
        inspected.append(normalize_candidate(parsed))
    return inspected


def collect_and_inspect_candidates(
    requested_keywords: list[str],
    hiring_intent_terms: list[str] | None = None,
    collection_inputs: list[dict[str, object]] | None = None,
    collection_source_types: list[str] | None = None,
    limit: int | None = None,
) -> list[dict[str, object]]:
    raw_candidates = collect_candidates(
        requested_keywords=requested_keywords,
        hiring_intent_terms=hiring_intent_terms,
        collection_inputs=collection_inputs,
        collection_source_types=collection_source_types,
        candidate_limit=limit,
    )
    return inspect_candidates(raw_candidates, requested_keywords, limit)


def analyze_inspected_candidates(
    candidates: list[dict[str, object]],
    requested_keywords: list[str],
    *,
    ai_enabled: bool = False,
) -> list[dict[str, object]]:
    analyzed = []
    for candidate in candidates:
        if candidate.get("outcome") == "accepted":
            result = analyze_candidate(candidate, requested_keywords, ai_enabled=ai_enabled)
            analyzed.append(flatten_review_profile(candidate, result.review_profile))
        else:
            analyzed.append(
                {
                    **candidate,
                    "analysis_status": "skipped",
                    "score_factors": {},
                    "missing_keywords": [],
                    "historical_similarity_signals": {},
                }
            )
    return analyzed


def apply_ai_filters(
    candidates: list[dict[str, object]],
    *,
    enabled: bool,
    settings_payload: object,
    provider: Callable[[dict[str, object]], dict[str, object]] | None = None,
    model_name: str | None = None,
    profile_context: dict[str, object] | None = None,
    log_context: dict[str, object] | None = None,
) -> list[dict[str, object]]:
    settings = normalize_ai_filter_settings(settings_payload)
    filtered: list[dict[str, object]] = []
    for candidate_index, candidate in enumerate(candidates, start=1):
        candidate_log_context = {
            **(log_context or {}),
            "candidate_index": candidate_index,
            "candidate_count": len(candidates),
        }
        if candidate.get("outcome") != "accepted":
            decision = evaluate_ai_filter(candidate, settings, enabled=False, log_context=candidate_log_context)
        else:
            decision = evaluate_ai_filter(
                candidate,
                settings,
                enabled=enabled,
                provider=provider,
                model_name=model_name,
                profile_context=profile_context,
                log_context=candidate_log_context,
            )
        next_candidate = apply_decision(candidate, decision)
        if decision.ai_filter_status == "rejected" or decision.passes_ai_filter is False:
            next_candidate["outcome"] = "rejected_ai_filter"
            next_candidate["rejection_reason"] = decision.ai_filter_reason
        elif decision.ai_filter_status == "failed":
            next_candidate["outcome"] = "failed_ai_filter"
            next_candidate["rejection_reason"] = decision.ai_filter_error_message or decision.ai_filter_reason
        filtered.append(next_candidate)
    return filtered


def log_worker_event(event: str, payload: dict[str, object]) -> None:
    print("[linkedin-job-search] " + json.dumps({"event": event, **payload}, ensure_ascii=False, default=str), flush=True)


def load_profile_context(db: Session, user_id: str) -> dict[str, object]:
    settings = None
    resume = None
    try:
        settings = db.execute(
            text(
                """
                SELECT operator_name, operator_email, portfolio_url
                FROM user_settings
                WHERE user_id = :user_id
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    except SQLAlchemyError:
        db.rollback()
    try:
        resume = db.execute(
            text(
                """
                SELECT display_name, file_name, file_path, file_content, mime_type
                FROM resume_attachments
                WHERE user_id = :user_id AND is_available = true
                ORDER BY is_default DESC, uploaded_at DESC, created_at DESC
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    except SQLAlchemyError:
        db.rollback()
    resume_context = None
    if resume:
        text_excerpt, status = extract_resume_text(dict(resume))
        resume_context = {
            "display_name": resume["display_name"],
            "file_name": resume["file_name"],
            "mime_type": resume["mime_type"],
            "text_extraction_status": status,
            "text_excerpt": text_excerpt[:8000] if text_excerpt else None,
        }
    return {
        "operator": dict(settings) if settings else {},
        "resume": resume_context,
        "instructions": [
            "Use this profile only to judge whether a captured opportunity seems relevant to the user.",
            "Do not invent skills that are absent from the resume/profile context.",
            "Prefer roles aligned with the user's visible stack and experience.",
        ],
    }


def extract_resume_text(resume: dict[str, object]) -> tuple[str | None, str]:
    file_name = str(resume.get("file_name") or "")
    mime_type = str(resume.get("mime_type") or "")
    if mime_type != "application/pdf" and not file_name.lower().endswith(".pdf"):
        return None, "Resume is not a PDF; only metadata is available."
    content = resume.get("file_content")
    if not isinstance(content, bytes):
        file_path = str(resume.get("file_path") or "")
        try:
            content = Path(file_path).read_bytes()
        except OSError:
            return None, "Resume file could not be read; only metadata is available."
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))
        page_text = [page.extract_text() or "" for page in reader.pages[:8]]
    except Exception:
        return None, "PDF text extraction failed; only metadata is available."
    text_value = "\n".join(part.strip() for part in page_text if part.strip()).strip()
    if not text_value:
        return None, "PDF text extraction returned no text; only metadata is available."
    return text_value, "PDF text extracted successfully."


def select_pending_runs(db: Session, limit: int = 1) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT *
            FROM job_search_runs
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    )
    return [dict(row) for row in rows.mappings()]


def claim_pending_run(db: Session, run_id: str) -> dict[str, Any] | None:
    run = db.execute(
        text("SELECT * FROM job_search_runs WHERE id = :run_id AND status = 'pending'"),
        {"run_id": run_id},
    ).mappings().first()
    if run is None:
        return None

    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = 'running', started_at = :now, updated_at = :now
            WHERE id = :run_id AND status = 'pending'
            """
        ),
        {"run_id": run_id, "now": now},
    )
    db.commit()
    return dict(
        db.execute(text("SELECT * FROM job_search_runs WHERE id = :run_id"), {"run_id": run_id}).mappings().one()
    )


def recover_stale_running_runs(
    db: Session,
    *,
    older_than_minutes: int | None = None,
    provider_error_code: str = "stale_running",
    message: str = "Run was left running before worker startup and was not retried automatically.",
) -> int:
    now = datetime.now(UTC)
    timeout_filter = ""
    params: dict[str, object] = {"message": message, "now": now, "provider_error_code": provider_error_code}
    if older_than_minutes is not None:
        cutoff = now - timedelta(minutes=older_than_minutes)
        timeout_filter = "AND COALESCE(started_at, updated_at, created_at) <= :cutoff"
        params["cutoff"] = cutoff
    result = db.execute(
        text(
            f"""
            UPDATE job_search_runs
            SET status = 'failed',
                provider_status = 'failed',
                provider_error_code = :provider_error_code,
                provider_error_message = :message,
                error_message = :message,
                completed_at = :now,
                updated_at = :now
            WHERE status = 'running'
            {timeout_filter}
            """
        ),
        params,
    )
    db.commit()
    return int(result.rowcount or 0)


def load_collection_inputs(db: Session, run_id: str) -> list[dict[str, object]]:
    rows = db.execute(
        text(
            """
            SELECT source_type, source_url, provided_text, label
            FROM linkedin_collection_inputs
            WHERE run_id = :run_id
            ORDER BY created_at ASC
            """
        ),
        {"run_id": run_id},
    )
    return [dict(row) for row in rows.mappings()]


def aggregate_provider_status(candidates: list[dict[str, object]]) -> str:
    statuses = [str(candidate.get("provider_status") or "collected") for candidate in candidates]
    if not statuses:
        return "empty"
    success = any(status == "collected" for status in statuses)
    failures = [status for status in statuses if status in TERMINAL_FAILURE_STATUSES]
    if success and failures:
        return "partial"
    if success:
        return "collected"
    unique_failures = set(failures)
    if len(unique_failures) == 1:
        return unique_failures.pop()
    return "failed"


def final_run_status(candidates: list[dict[str, object]], accepted_count: int) -> str:
    if not candidates:
        return "completed_no_results"
    if accepted_count > 0:
        return "completed"
    if all(str(candidate.get("provider_status") or "") == "failed" for candidate in candidates):
        return "failed"
    return "completed_no_results"


def ensure_default_keyword_set(db: Session) -> str:
    existing = db.execute(
        text(
            """
            SELECT id
            FROM keyword_sets
            WHERE opportunity_type = 'job' AND source = 'mock' AND is_default = true
            LIMIT 1
            """
        )
    ).scalar_one_or_none()
    if existing:
        return str(existing)

    keyword_set_id = new_id()
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            INSERT INTO keyword_sets (
                id, name, source, opportunity_type, terms, is_active, is_default, created_at, updated_at
            )
            VALUES (
                :id, 'Default Mock Job Keywords', 'mock', 'job', :terms, true, true, :now, :now
            )
            """
        ),
        {"id": keyword_set_id, "terms": json.dumps(["reactjs", "typescript", "nextjs", "nodejs"]), "now": now},
    )
    db.commit()
    return keyword_set_id


def find_existing_opportunity_id(db: Session, dedupe_key: str, user_id: str) -> str | None:
    return db.execute(
        text(
            """
            SELECT d.opportunity_id
            FROM job_opportunity_details d
            JOIN opportunities o ON o.id = d.opportunity_id
            WHERE d.dedupe_key = :dedupe_key
              AND o.user_id = :user_id
            LIMIT 1
            """
        ),
        {"dedupe_key": dedupe_key, "user_id": user_id},
    ).scalar_one_or_none()


def create_job_opportunity(db: Session, user_id: str, candidate: dict[str, object], dedupe_key: str) -> str:
    opportunity_id = new_id()
    detail_id = new_id()
    now = datetime.now(UTC)
    matched_keywords = [str(keyword) for keyword in candidate.get("matched_keywords", []) if keyword]
    source_evidence = str(candidate.get("source_evidence") or "")
    contact_channel_type = str(candidate.get("contact_channel_type") or "email")
    contact_value = str(candidate.get("contact_channel_value") or "")
    title = str(candidate.get("role_title") or candidate.get("post_headline") or "")
    company = str(candidate.get("company_name") or "")

    db.execute(
        text(
            """
            INSERT INTO opportunities (
                id, user_id, opportunity_type, title, organization_name, source_name, source_url, source_query,
                source_evidence, captured_at, created_at, updated_at
            )
            VALUES (
                :id, :user_id, 'job', :title, :company, 'LinkedIn', :source_url, :source_query,
                :source_evidence, :now, :now, :now
            )
            """
        ),
        {
            "id": opportunity_id,
            "user_id": user_id,
            "title": truncate_string(title, 500) or "",
            "company": truncate_string(company, 255) or "",
            "source_url": str(candidate.get("source_url") or ""),
            "source_query": str(candidate.get("source_query") or ""),
            "source_evidence": source_evidence,
            "now": now,
        },
    )
    db.execute(
        text(
            """
            INSERT INTO job_opportunity_details (
                id, opportunity_id, company_name, role_title, post_headline, job_description,
                contact_channel_type, contact_channel_value, contact_email, application_url, linkedin_url,
                poster_profile_url, contact_priority, hiring_intent_term, collection_source_type,
                matched_keywords, dedupe_key, job_stage, review_status, match_score, score_explanation,
                score_factors, analysis_status, analysis_confidence, analysis_error_code,
                analysis_error_message, normalized_company_name, normalized_role_title,
                detected_seniority, detected_modality, detected_location, missing_keywords,
                historical_similarity_signals, created_at, updated_at
            )
            VALUES (
                :id, :opportunity_id, :company_name, :role_title, :post_headline, :job_description,
                :contact_channel_type, :contact_channel_value, :contact_email, :application_url, :linkedin_url,
                :poster_profile_url, :contact_priority, :hiring_intent_term, :collection_source_type,
                :matched_keywords, :dedupe_key, 'new', :review_status, :match_score, :score_explanation,
                :score_factors, :analysis_status, :analysis_confidence, :analysis_error_code,
                :analysis_error_message, :normalized_company_name, :normalized_role_title,
                :detected_seniority, :detected_modality, :detected_location, :missing_keywords,
                :historical_similarity_signals, :now, :now
            )
            """
        ),
        {
            "id": detail_id,
            "opportunity_id": opportunity_id,
            "company_name": truncate_string(company, 255),
            "role_title": truncate_string(candidate.get("role_title"), 500),
            "post_headline": truncate_string(candidate.get("post_headline"), 500),
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": truncate_string(contact_channel_type, 50),
            "contact_channel_value": truncate_string(contact_value, 500),
            "contact_email": truncate_string(contact_value, 320) if contact_channel_type == "email" else None,
            "application_url": str(candidate.get("job_url") or candidate.get("source_url") or "") or None,
            "linkedin_url": str(candidate.get("source_url") or ""),
            "poster_profile_url": str(candidate.get("poster_profile_url") or "") or None,
            "contact_priority": truncate_string(candidate.get("contact_priority"), 50),
            "hiring_intent_term": truncate_string(candidate.get("hiring_intent_term"), 100),
            "collection_source_type": truncate_string(candidate.get("collection_source_type"), 50),
            "matched_keywords": json.dumps(matched_keywords),
            "dedupe_key": dedupe_key,
            "review_status": str(candidate.get("review_status") or "unreviewed"),
            "match_score": candidate.get("match_score"),
            "score_explanation": str(candidate.get("score_explanation") or ""),
            "score_factors": json.dumps(candidate.get("score_factors") or {}),
            "analysis_status": str(candidate.get("analysis_status") or "deterministic_only"),
            "analysis_confidence": str(candidate.get("analysis_confidence") or "") or None,
            "analysis_error_code": str(candidate.get("analysis_error_code") or "") or None,
            "analysis_error_message": str(candidate.get("analysis_error_message") or "") or None,
            "normalized_company_name": truncate_string(candidate.get("normalized_company_name") or company, 255),
            "normalized_role_title": truncate_string(candidate.get("normalized_role_title") or title, 500),
            "detected_seniority": truncate_string(candidate.get("detected_seniority"), 100),
            "detected_modality": truncate_string(candidate.get("detected_modality"), 100),
            "detected_location": truncate_string(candidate.get("detected_location"), 255),
            "missing_keywords": json.dumps(candidate.get("missing_keywords") or []),
            "historical_similarity_signals": json.dumps(candidate.get("historical_similarity_signals") or {}),
            "now": now,
        },
    )

    keyword_set_id = ensure_default_keyword_set(db)
    for keyword in matched_keywords:
        db.execute(
            text(
                """
                INSERT INTO opportunity_keyword_matches (
                    id, opportunity_id, keyword_set_id, matched_term, match_context, created_at
                )
                VALUES (:id, :opportunity_id, :keyword_set_id, :matched_term, :match_context, :now)
                """
            ),
            {
                "id": new_id(),
                "opportunity_id": opportunity_id,
                "keyword_set_id": keyword_set_id,
                "matched_term": keyword,
                "match_context": source_evidence,
                "now": now,
            },
        )
    return opportunity_id


def record_candidate(db: Session, run_id: str, user_id: str, candidate: dict[str, object]) -> str:
    outcome = str(candidate.get("outcome") or "accepted")
    dedupe_key = truncate_string(build_job_dedupe_key(candidate), 1000) or ""
    opportunity_id = None

    if outcome == "accepted":
        existing_opportunity_id = find_existing_opportunity_id(db, dedupe_key, user_id)
        if existing_opportunity_id:
            outcome = "duplicate"
            opportunity_id = existing_opportunity_id
        else:
            opportunity_id = create_job_opportunity(db, user_id, candidate, dedupe_key)

    row_id = new_id()
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            INSERT INTO job_search_candidates (
                id, user_id, run_id, opportunity_id, outcome, company_name, role_title, post_headline,
                job_description, contact_channel_type, contact_channel_value, collection_source_type,
                hiring_intent_term, provider_name, provider_status, provider_error_code,
                poster_profile_url, contact_priority, source_url, source_query, source_evidence,
                matched_keywords, match_score, score_explanation, score_factors, analysis_status,
                analysis_confidence, analysis_error_code, analysis_error_message, ai_model_name,
                ai_prompt_version, passes_ai_filter, ai_filter_status, ai_filter_reason, ai_filter_confidence,
                ai_filter_signals, ai_filter_error_code, ai_filter_error_message, ai_filter_model_name,
                ai_filter_prompt_version, normalized_company_name, normalized_role_title, detected_seniority,
                detected_modality, detected_location, missing_keywords, historical_similarity_signals,
                raw_excerpt, dedupe_key, rejection_reason, inspected_at, created_at
            )
            VALUES (
                :id, :user_id, :run_id, :opportunity_id, :outcome, :company_name, :role_title, :post_headline,
                :job_description, :contact_channel_type, :contact_channel_value, :collection_source_type,
                :hiring_intent_term, :provider_name, :provider_status, :provider_error_code,
                :poster_profile_url, :contact_priority, :source_url, :source_query, :source_evidence,
                :matched_keywords, :match_score, :score_explanation, :score_factors, :analysis_status,
                :analysis_confidence, :analysis_error_code, :analysis_error_message, :ai_model_name,
                :ai_prompt_version, :passes_ai_filter, :ai_filter_status, :ai_filter_reason, :ai_filter_confidence,
                :ai_filter_signals, :ai_filter_error_code, :ai_filter_error_message, :ai_filter_model_name,
                :ai_filter_prompt_version, :normalized_company_name, :normalized_role_title, :detected_seniority,
                :detected_modality, :detected_location, :missing_keywords, :historical_similarity_signals,
                :raw_excerpt, :dedupe_key, :rejection_reason, :now, :now
            )
            """
        ),
        {
            "id": row_id,
            "user_id": user_id,
            "run_id": run_id,
            "opportunity_id": opportunity_id,
            "outcome": truncate_string(outcome, 50) or "accepted",
            "company_name": truncate_string(candidate.get("company_name"), 255) or "",
            "role_title": truncate_string(candidate.get("role_title"), 500) or "",
            "post_headline": truncate_string(candidate.get("post_headline"), 500) or "",
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": truncate_string(candidate.get("contact_channel_type"), 50),
            "contact_channel_value": truncate_string(candidate.get("contact_channel_value"), 500),
            "collection_source_type": truncate_string(candidate.get("collection_source_type"), 50) or "",
            "hiring_intent_term": truncate_string(candidate.get("hiring_intent_term"), 100) or "",
            "provider_name": truncate_string(candidate.get("provider_name"), 100) or "",
            "provider_status": truncate_string(candidate.get("provider_status") or "collected", 50) or "collected",
            "provider_error_code": truncate_string(candidate.get("provider_error_code"), 100),
            "poster_profile_url": str(candidate.get("poster_profile_url") or "") or None,
            "contact_priority": truncate_string(candidate.get("contact_priority"), 50),
            "source_url": str(candidate.get("source_url") or ""),
            "source_query": str(candidate.get("source_query") or ""),
            "source_evidence": str(candidate.get("source_evidence") or "") or None,
            "matched_keywords": json.dumps([str(keyword) for keyword in candidate.get("matched_keywords", []) if keyword]),
            "match_score": candidate.get("match_score"),
            "score_explanation": str(candidate.get("score_explanation") or "") or None,
            "score_factors": json.dumps(candidate.get("score_factors") or {}),
            "analysis_status": truncate_string(candidate.get("analysis_status") or "skipped", 50) or "skipped",
            "analysis_confidence": truncate_string(candidate.get("analysis_confidence"), 50),
            "analysis_error_code": truncate_string(candidate.get("analysis_error_code"), 100),
            "analysis_error_message": str(candidate.get("analysis_error_message") or "") or None,
            "ai_model_name": truncate_string(candidate.get("ai_model_name"), 255),
            "ai_prompt_version": truncate_string(candidate.get("ai_prompt_version"), 100),
            "passes_ai_filter": candidate.get("passes_ai_filter") if isinstance(candidate.get("passes_ai_filter"), bool) else None,
            "ai_filter_status": truncate_string(candidate.get("ai_filter_status") or "skipped", 50) or "skipped",
            "ai_filter_reason": str(candidate.get("ai_filter_reason") or "") or None,
            "ai_filter_confidence": candidate.get("ai_filter_confidence")
            if isinstance(candidate.get("ai_filter_confidence"), int | float)
            else None,
            "ai_filter_signals": json.dumps(candidate.get("ai_filter_signals") or {}),
            "ai_filter_error_code": truncate_string(candidate.get("ai_filter_error_code"), 100),
            "ai_filter_error_message": str(candidate.get("ai_filter_error_message") or "") or None,
            "ai_filter_model_name": truncate_string(candidate.get("ai_filter_model_name"), 255),
            "ai_filter_prompt_version": truncate_string(candidate.get("ai_filter_prompt_version"), 100),
            "normalized_company_name": truncate_string(
                candidate.get("normalized_company_name") or candidate.get("company_name"), 255
            ),
            "normalized_role_title": truncate_string(
                candidate.get("normalized_role_title") or candidate.get("role_title") or candidate.get("post_headline"), 500
            ),
            "detected_seniority": truncate_string(candidate.get("detected_seniority"), 100),
            "detected_modality": truncate_string(candidate.get("detected_modality"), 100),
            "detected_location": truncate_string(candidate.get("detected_location"), 255),
            "missing_keywords": json.dumps(candidate.get("missing_keywords") or []),
            "historical_similarity_signals": json.dumps(candidate.get("historical_similarity_signals") or {}),
            "raw_excerpt": str(candidate.get("raw_excerpt") or "") or None,
            "dedupe_key": dedupe_key,
            "rejection_reason": str(candidate.get("rejection_reason") or "") or None,
            "now": now,
        },
    )
    candidate["outcome"] = outcome
    candidate["opportunity_id"] = opportunity_id
    return row_id


def update_running_run_progress(db: Session, run_id: str, candidates: list[dict[str, object]]) -> None:
    inspected_count = len(candidates)
    accepted_count = sum(1 for candidate in candidates if candidate.get("outcome") == "accepted")
    duplicate_count = sum(1 for candidate in candidates if candidate.get("outcome") == "duplicate")
    rejected_count = sum(1 for candidate in candidates if str(candidate.get("outcome") or "") in REJECTED_OUTCOMES)
    ai_filter_inspected_count = sum(
        1 for candidate in candidates if candidate.get("ai_filter_status") in {"passed", "rejected", "fallback", "failed"}
    )
    ai_filter_passed_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "passed")
    ai_filter_rejected_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "rejected")
    ai_filter_fallback_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "fallback")
    ai_filter_failed_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "failed")
    ai_filter_skipped_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "skipped")
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET inspected_count = :inspected_count,
                accepted_count = :accepted_count,
                rejected_count = :rejected_count,
                duplicate_count = :duplicate_count,
                ai_filter_inspected_count = :ai_filter_inspected_count,
                ai_filter_passed_count = :ai_filter_passed_count,
                ai_filter_rejected_count = :ai_filter_rejected_count,
                ai_filter_fallback_count = :ai_filter_fallback_count,
                ai_filter_failed_count = :ai_filter_failed_count,
                ai_filter_skipped_count = :ai_filter_skipped_count,
                updated_at = :now
            WHERE id = :run_id AND status = 'running'
            """
        ),
        {
            "run_id": run_id,
            "inspected_count": inspected_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "duplicate_count": duplicate_count,
            "ai_filter_inspected_count": ai_filter_inspected_count,
            "ai_filter_passed_count": ai_filter_passed_count,
            "ai_filter_rejected_count": ai_filter_rejected_count,
            "ai_filter_fallback_count": ai_filter_fallback_count,
            "ai_filter_failed_count": ai_filter_failed_count,
            "ai_filter_skipped_count": ai_filter_skipped_count,
            "now": now,
        },
    )


def finalize_run(db: Session, run_id: str, candidates: list[dict[str, object]]) -> None:
    inspected_count = len(candidates)
    accepted_count = sum(1 for candidate in candidates if candidate.get("outcome") == "accepted")
    duplicate_count = sum(1 for candidate in candidates if candidate.get("outcome") == "duplicate")
    rejected_count = sum(1 for candidate in candidates if str(candidate.get("outcome") or "") in REJECTED_OUTCOMES)
    provider_status = aggregate_provider_status(candidates)
    deterministic_only_count = sum(1 for candidate in candidates if candidate.get("analysis_status") == "deterministic_only")
    ai_assisted_count = sum(1 for candidate in candidates if candidate.get("analysis_status") == "ai_assisted")
    analysis_fallback_count = sum(1 for candidate in candidates if candidate.get("analysis_status") == "fallback")
    analysis_failed_count = sum(1 for candidate in candidates if candidate.get("analysis_status") == "failed")
    analysis_skipped_count = sum(1 for candidate in candidates if candidate.get("analysis_status") == "skipped")
    ai_filter_inspected_count = sum(
        1 for candidate in candidates if candidate.get("ai_filter_status") in {"passed", "rejected", "fallback", "failed"}
    )
    ai_filter_passed_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "passed")
    ai_filter_rejected_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "rejected")
    ai_filter_fallback_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "fallback")
    ai_filter_failed_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "failed")
    ai_filter_skipped_count = sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "skipped")
    ai_filter_status = "skipped"
    if ai_filter_failed_count:
        ai_filter_status = "failed"
    elif ai_filter_rejected_count:
        ai_filter_status = "rejected"
    elif ai_filter_fallback_count:
        ai_filter_status = "fallback"
    elif ai_filter_passed_count:
        ai_filter_status = "passed"
    analysis_status = "deterministic_only"
    if analysis_failed_count:
        analysis_status = "failed"
    elif analysis_fallback_count:
        analysis_status = "fallback"
    elif ai_assisted_count:
        analysis_status = "ai_assisted"
    elif analysis_skipped_count and not deterministic_only_count:
        analysis_status = "skipped"
    status = final_run_status(candidates, accepted_count)
    provider_error = next((candidate for candidate in candidates if candidate.get("provider_error_code")), None)
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = :status,
                inspected_count = :inspected_count,
                accepted_count = :accepted_count,
                rejected_count = :rejected_count,
                duplicate_count = :duplicate_count,
                cap_reached = :cap_reached,
                provider_status = :provider_status,
                provider_error_code = :provider_error_code,
                provider_error_message = :provider_error_message,
                analysis_status = :analysis_status,
                deterministic_only_count = :deterministic_only_count,
                ai_assisted_count = :ai_assisted_count,
                analysis_fallback_count = :analysis_fallback_count,
                analysis_failed_count = :analysis_failed_count,
                analysis_skipped_count = :analysis_skipped_count,
                ai_filter_status = :ai_filter_status,
                ai_filter_inspected_count = :ai_filter_inspected_count,
                ai_filter_passed_count = :ai_filter_passed_count,
                ai_filter_rejected_count = :ai_filter_rejected_count,
                ai_filter_fallback_count = :ai_filter_fallback_count,
                ai_filter_failed_count = :ai_filter_failed_count,
                ai_filter_skipped_count = :ai_filter_skipped_count,
                completed_at = :now,
                updated_at = :now
            WHERE id = :run_id
            """
        ),
        {
            "run_id": run_id,
            "status": status,
            "inspected_count": inspected_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "duplicate_count": duplicate_count,
            "cap_reached": False,
            "provider_status": provider_status,
            "provider_error_code": str(provider_error.get("provider_error_code") or "") if provider_error else None,
            "provider_error_message": str(provider_error.get("rejection_reason") or "") if provider_error else None,
            "analysis_status": analysis_status,
            "deterministic_only_count": deterministic_only_count,
            "ai_assisted_count": ai_assisted_count,
            "analysis_fallback_count": analysis_fallback_count,
            "analysis_failed_count": analysis_failed_count,
            "analysis_skipped_count": analysis_skipped_count,
            "ai_filter_status": ai_filter_status,
            "ai_filter_inspected_count": ai_filter_inspected_count,
            "ai_filter_passed_count": ai_filter_passed_count,
            "ai_filter_rejected_count": ai_filter_rejected_count,
            "ai_filter_fallback_count": ai_filter_fallback_count,
            "ai_filter_failed_count": ai_filter_failed_count,
            "ai_filter_skipped_count": ai_filter_skipped_count,
            "now": now,
        },
    )
    db.commit()


def fail_running_run(db: Session, run_id: str, error_message: str) -> None:
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = 'failed',
                provider_status = 'failed',
                provider_error_code = 'worker_failed',
                provider_error_message = :error_message,
                error_message = :error_message,
                completed_at = :now,
                updated_at = :now
            WHERE id = :run_id
            """
        ),
        {"run_id": run_id, "error_message": error_message, "now": now},
    )
    db.commit()


def process_one_run(db: Session, pending_run: dict[str, Any], settings: WorkerSettings | None = None) -> bool:
    settings = settings or get_worker_settings()
    run = claim_pending_run(db, str(pending_run["id"]))
    if run is None:
        return False

    requested_keywords = json_list(run.get("requested_keywords"), ["reactjs", "typescript", "nextjs", "nodejs"])
    hiring_terms = json_list(run.get("hiring_intent_terms"), DEFAULT_HIRING_INTENT_TERMS)
    collection_source_types = json_list(run.get("collection_source_types"), ["automatic_publication_search"])
    candidate_limit = int(run["candidate_limit"]) if run.get("candidate_limit") is not None else None
    collection_inputs = load_collection_inputs(db, str(run["id"]))
    user_id = str(run["user_id"])
    ai_filter_settings = run.get("ai_filter_settings")
    if isinstance(ai_filter_settings, str):
        try:
            ai_filter_settings = json.loads(ai_filter_settings)
        except json.JSONDecodeError:
            ai_filter_settings = {}
    ai_filters_enabled = bool(run.get("ai_filters_enabled")) and settings.job_ai_filters_enabled
    profile_context = load_profile_context(db, user_id) if ai_filters_enabled else None
    ai_filter_provider = None
    if ai_filters_enabled and settings.openai_api_key and settings.openai_api_key != "sk-your-openai-api-key":
        ai_filter_provider = openai_ai_filter_provider(
            settings.openai_api_key,
            settings.job_ai_filter_model_name or "gpt-4o-mini",
        )
    log_worker_event(
        "ai_filter_config",
        {
            "run_id": str(run["id"]),
            "user_id": user_id,
            "run_ai_filters_enabled": bool(run.get("ai_filters_enabled")),
            "worker_ai_filters_enabled": settings.job_ai_filters_enabled,
            "effective_ai_filters_enabled": ai_filters_enabled,
            "provider_configured": ai_filter_provider is not None,
            "model_name": settings.job_ai_filter_model_name,
            "settings": ai_filter_settings or {},
            "requested_keywords": requested_keywords,
            "hiring_intent_terms": hiring_terms,
            "collection_source_types": collection_source_types,
            "candidate_limit": candidate_limit,
        },
    )

    try:
        raw_candidates = collect_candidates(
            requested_keywords=requested_keywords,
            hiring_intent_terms=hiring_terms,
            collection_inputs=collection_inputs,
            collection_source_types=collection_source_types,
            candidate_limit=candidate_limit,
        )
        selected_raw_candidates = raw_candidates if candidate_limit is None else raw_candidates[:candidate_limit]
        candidates: list[dict[str, object]] = []
        for candidate_index, raw_candidate in enumerate(selected_raw_candidates, start=1):
            candidate = normalize_candidate(parse_candidate(raw_candidate, requested_keywords))
            candidate = analyze_inspected_candidates(
                [candidate],
                requested_keywords,
                ai_enabled=settings.job_review_ai_analysis_enabled,
            )[0]
            candidate = apply_ai_filters(
                [candidate],
                enabled=ai_filters_enabled,
                settings_payload=ai_filter_settings,
                provider=ai_filter_provider,
                model_name=settings.job_ai_filter_model_name,
                profile_context=profile_context,
                log_context={
                    "run_id": str(run["id"]),
                    "user_id": user_id,
                    "provider_configured": ai_filter_provider is not None,
                    "effective_ai_filters_enabled": ai_filters_enabled,
                    "model_name": settings.job_ai_filter_model_name,
                    "candidate_index": candidate_index,
                    "candidate_count": len(selected_raw_candidates),
                },
            )[0]
            record_candidate(db, str(run["id"]), user_id, candidate)
            candidates.append(candidate)
            update_running_run_progress(db, str(run["id"]), candidates)
            db.commit()
            log_worker_event(
                "run_progress",
                {
                    "run_id": str(run["id"]),
                    "candidate_index": candidate_index,
                    "candidate_count": len(selected_raw_candidates),
                    "accepted_count": sum(1 for item in candidates if item.get("outcome") == "accepted"),
                    "rejected_count": sum(1 for item in candidates if str(item.get("outcome") or "") in REJECTED_OUTCOMES),
                    "duplicate_count": sum(1 for item in candidates if item.get("outcome") == "duplicate"),
                },
            )
        finalize_run(db, str(run["id"]), candidates)
        log_worker_event(
            "ai_filter_summary",
            {
                "run_id": str(run["id"]),
                "candidate_count": len(candidates),
                "accepted_count": sum(1 for candidate in candidates if candidate.get("outcome") == "accepted"),
                "rejected_ai_filter_count": sum(
                    1 for candidate in candidates if candidate.get("outcome") == "rejected_ai_filter"
                ),
                "fallback_count": sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "fallback"),
                "passed_count": sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "passed"),
                "rejected_count": sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "rejected"),
                "failed_count": sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "failed"),
                "skipped_count": sum(1 for candidate in candidates if candidate.get("ai_filter_status") == "skipped"),
            },
        )
        return True
    except Exception as exc:
        db.rollback()
        fail_running_run(db, str(run["id"]), str(exc))
        return False


def process_pending_runs(
    db: Session | None = None,
    *,
    settings: WorkerSettings | None = None,
    run_once: bool | None = None,
) -> int:
    """Poll and process API-created pending LinkedIn job search runs."""
    settings = settings or get_worker_settings()
    owns_session = db is None
    db = db or new_session()
    processed = 0

    try:
        if settings.worker_mark_stale_running_on_startup:
            recover_stale_running_runs(db)

        should_run_once = settings.worker_run_once if run_once is None else run_once
        while True:
            if settings.worker_running_run_timeout_minutes > 0:
                recover_stale_running_runs(
                    db,
                    older_than_minutes=settings.worker_running_run_timeout_minutes,
                    provider_error_code="running_timeout",
                    message=(
                        "Run exceeded the worker running timeout and was marked failed so new captures "
                        "are not blocked by stale processing."
                    ),
                )
            pending_runs = select_pending_runs(db, settings.worker_max_runs_per_loop)
            for pending_run in pending_runs:
                if process_one_run(db, pending_run, settings=settings):
                    processed += 1

            if should_run_once:
                return processed
            time.sleep(settings.worker_poll_interval_seconds)
    finally:
        if owns_session:
            db.close()
