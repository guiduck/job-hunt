from __future__ import annotations

from datetime import UTC, datetime
import json
import time
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import WorkerSettings, get_worker_settings
from app.db.session import new_session
from app.services.job_candidate_normalizer import normalize_candidate
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


def normalize_key_part(value: str) -> str:
    return " ".join(value.lower().strip().split())


def build_job_dedupe_key(candidate: dict[str, object]) -> str:
    title = str(candidate.get("role_title") or candidate.get("post_headline") or "")
    keywords = sorted({normalize_key_part(str(keyword)) for keyword in candidate.get("matched_keywords", []) if keyword})
    return "|".join(
        [
            normalize_key_part(str(candidate.get("company_name") or "")),
            normalize_key_part(title),
            ",".join(keywords),
            normalize_key_part(str(candidate.get("contact_channel_value") or "")),
        ]
    )


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


def recover_stale_running_runs(db: Session) -> int:
    now = datetime.now(UTC)
    message = "Run was left running before worker startup and was not retried automatically."
    result = db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = 'failed',
                provider_status = 'failed',
                provider_error_code = 'stale_running',
                provider_error_message = :message,
                error_message = :message,
                completed_at = :now,
                updated_at = :now
            WHERE status = 'running'
            """
        ),
        {"message": message, "now": now},
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


def find_existing_opportunity_id(db: Session, dedupe_key: str) -> str | None:
    return db.execute(
        text("SELECT opportunity_id FROM job_opportunity_details WHERE dedupe_key = :dedupe_key LIMIT 1"),
        {"dedupe_key": dedupe_key},
    ).scalar_one_or_none()


def create_job_opportunity(db: Session, candidate: dict[str, object], dedupe_key: str) -> str:
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
                id, opportunity_type, title, organization_name, source_name, source_url, source_query,
                source_evidence, captured_at, created_at, updated_at
            )
            VALUES (
                :id, 'job', :title, :company, 'LinkedIn', :source_url, :source_query,
                :source_evidence, :now, :now, :now
            )
            """
        ),
        {
            "id": opportunity_id,
            "title": title,
            "company": company,
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
                contact_channel_type, contact_channel_value, contact_email, linkedin_url,
                poster_profile_url, contact_priority, hiring_intent_term, collection_source_type,
                matched_keywords, dedupe_key, job_stage, review_status, match_score, score_explanation,
                score_factors, analysis_status, analysis_confidence, analysis_error_code,
                analysis_error_message, normalized_company_name, normalized_role_title,
                detected_seniority, detected_modality, detected_location, missing_keywords,
                historical_similarity_signals, created_at, updated_at
            )
            VALUES (
                :id, :opportunity_id, :company_name, :role_title, :post_headline, :job_description,
                :contact_channel_type, :contact_channel_value, :contact_email, :linkedin_url,
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
            "company_name": company,
            "role_title": str(candidate.get("role_title") or ""),
            "post_headline": str(candidate.get("post_headline") or ""),
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": contact_channel_type,
            "contact_channel_value": contact_value,
            "contact_email": contact_value if contact_channel_type == "email" else None,
            "linkedin_url": str(candidate.get("source_url") or ""),
            "poster_profile_url": str(candidate.get("poster_profile_url") or "") or None,
            "contact_priority": str(candidate.get("contact_priority") or "") or None,
            "hiring_intent_term": str(candidate.get("hiring_intent_term") or ""),
            "collection_source_type": str(candidate.get("collection_source_type") or ""),
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
            "normalized_company_name": str(candidate.get("normalized_company_name") or company) or None,
            "normalized_role_title": str(candidate.get("normalized_role_title") or title) or None,
            "detected_seniority": str(candidate.get("detected_seniority") or "") or None,
            "detected_modality": str(candidate.get("detected_modality") or "") or None,
            "detected_location": str(candidate.get("detected_location") or "") or None,
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


def record_candidate(db: Session, run_id: str, candidate: dict[str, object]) -> str:
    outcome = str(candidate.get("outcome") or "accepted")
    dedupe_key = build_job_dedupe_key(candidate)
    opportunity_id = None

    if outcome == "accepted":
        existing_opportunity_id = find_existing_opportunity_id(db, dedupe_key)
        if existing_opportunity_id:
            outcome = "duplicate"
            opportunity_id = existing_opportunity_id
        else:
            opportunity_id = create_job_opportunity(db, candidate, dedupe_key)

    row_id = new_id()
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            INSERT INTO job_search_candidates (
                id, run_id, opportunity_id, outcome, company_name, role_title, post_headline,
                job_description, contact_channel_type, contact_channel_value, collection_source_type,
                hiring_intent_term, provider_name, provider_status, provider_error_code,
                poster_profile_url, contact_priority, source_url, source_query, source_evidence,
                matched_keywords, match_score, score_explanation, score_factors, analysis_status,
                analysis_confidence, analysis_error_code, analysis_error_message, ai_model_name,
                ai_prompt_version, normalized_company_name, normalized_role_title, detected_seniority,
                detected_modality, detected_location, missing_keywords, historical_similarity_signals,
                raw_excerpt, dedupe_key, rejection_reason, inspected_at, created_at
            )
            VALUES (
                :id, :run_id, :opportunity_id, :outcome, :company_name, :role_title, :post_headline,
                :job_description, :contact_channel_type, :contact_channel_value, :collection_source_type,
                :hiring_intent_term, :provider_name, :provider_status, :provider_error_code,
                :poster_profile_url, :contact_priority, :source_url, :source_query, :source_evidence,
                :matched_keywords, :match_score, :score_explanation, :score_factors, :analysis_status,
                :analysis_confidence, :analysis_error_code, :analysis_error_message, :ai_model_name,
                :ai_prompt_version, :normalized_company_name, :normalized_role_title, :detected_seniority,
                :detected_modality, :detected_location, :missing_keywords, :historical_similarity_signals,
                :raw_excerpt, :dedupe_key, :rejection_reason, :now, :now
            )
            """
        ),
        {
            "id": row_id,
            "run_id": run_id,
            "opportunity_id": opportunity_id,
            "outcome": outcome,
            "company_name": str(candidate.get("company_name") or ""),
            "role_title": str(candidate.get("role_title") or ""),
            "post_headline": str(candidate.get("post_headline") or ""),
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": str(candidate.get("contact_channel_type") or "") or None,
            "contact_channel_value": str(candidate.get("contact_channel_value") or "") or None,
            "collection_source_type": str(candidate.get("collection_source_type") or ""),
            "hiring_intent_term": str(candidate.get("hiring_intent_term") or ""),
            "provider_name": str(candidate.get("provider_name") or ""),
            "provider_status": str(candidate.get("provider_status") or "collected"),
            "provider_error_code": str(candidate.get("provider_error_code") or "") or None,
            "poster_profile_url": str(candidate.get("poster_profile_url") or "") or None,
            "contact_priority": str(candidate.get("contact_priority") or "") or None,
            "source_url": str(candidate.get("source_url") or ""),
            "source_query": str(candidate.get("source_query") or ""),
            "source_evidence": str(candidate.get("source_evidence") or "") or None,
            "matched_keywords": json.dumps([str(keyword) for keyword in candidate.get("matched_keywords", []) if keyword]),
            "match_score": candidate.get("match_score"),
            "score_explanation": str(candidate.get("score_explanation") or "") or None,
            "score_factors": json.dumps(candidate.get("score_factors") or {}),
            "analysis_status": str(candidate.get("analysis_status") or "skipped"),
            "analysis_confidence": str(candidate.get("analysis_confidence") or "") or None,
            "analysis_error_code": str(candidate.get("analysis_error_code") or "") or None,
            "analysis_error_message": str(candidate.get("analysis_error_message") or "") or None,
            "ai_model_name": str(candidate.get("ai_model_name") or "") or None,
            "ai_prompt_version": str(candidate.get("ai_prompt_version") or "") or None,
            "normalized_company_name": str(candidate.get("normalized_company_name") or candidate.get("company_name") or "") or None,
            "normalized_role_title": str(candidate.get("normalized_role_title") or candidate.get("role_title") or candidate.get("post_headline") or "") or None,
            "detected_seniority": str(candidate.get("detected_seniority") or "") or None,
            "detected_modality": str(candidate.get("detected_modality") or "") or None,
            "detected_location": str(candidate.get("detected_location") or "") or None,
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
            "cap_reached": inspected_count >= 50,
            "provider_status": provider_status,
            "provider_error_code": str(provider_error.get("provider_error_code") or "") if provider_error else None,
            "provider_error_message": str(provider_error.get("rejection_reason") or "") if provider_error else None,
            "analysis_status": analysis_status,
            "deterministic_only_count": deterministic_only_count,
            "ai_assisted_count": ai_assisted_count,
            "analysis_fallback_count": analysis_fallback_count,
            "analysis_failed_count": analysis_failed_count,
            "analysis_skipped_count": analysis_skipped_count,
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

    try:
        candidates = collect_and_inspect_candidates(
            requested_keywords=requested_keywords,
            hiring_intent_terms=hiring_terms,
            collection_inputs=collection_inputs,
            collection_source_types=collection_source_types,
            limit=candidate_limit,
        )
        candidates = analyze_inspected_candidates(
            candidates,
            requested_keywords,
            ai_enabled=settings.job_review_ai_analysis_enabled,
        )
        for candidate in candidates:
            record_candidate(db, str(run["id"]), candidate)
        finalize_run(db, str(run["id"]), candidates)
        return True
    except Exception as exc:
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
