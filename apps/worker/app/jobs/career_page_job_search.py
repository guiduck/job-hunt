from __future__ import annotations

from datetime import UTC, datetime
import json
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import WorkerSettings, get_worker_settings
from app.db.session import new_session
from app.services.career_page_search_provider import fetch_serpapi_results
from app.services.career_page_sources import active_source_keys, source_by_key
from app.services.external_job_normalizer import normalize_external_job_result

ACTIVE_STATUSES = ("pending", "running")


def new_id() -> str:
    return str(uuid4())


def log_event(event: str, **payload: object) -> None:
    print(json.dumps({"event": event, **payload}, ensure_ascii=True))


def select_pending_runs(db: Session, limit: int = 1) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT *
            FROM job_search_runs
            WHERE status = 'pending'
              AND search_kind = 'career_page'
            ORDER BY created_at ASC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings()
    return [dict(row) for row in rows]


def claim_pending_run(db: Session, run_id: str) -> dict[str, Any] | None:
    now = datetime.now(UTC)
    run = db.execute(
        text("SELECT * FROM job_search_runs WHERE id = :run_id AND status = 'pending' AND search_kind = 'career_page'"),
        {"run_id": run_id},
    ).mappings().first()
    if run is None:
        return None
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = 'running', started_at = :now, updated_at = :now, provider_status = 'not_started'
            WHERE id = :run_id
            """
        ),
        {"run_id": run_id, "now": now},
    )
    db.commit()
    return dict(db.execute(text("SELECT * FROM job_search_runs WHERE id = :run_id"), {"run_id": run_id}).mappings().one())


def _json(value: object) -> str:
    return json.dumps(value if value is not None else {}, ensure_ascii=True)


def _list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        return _list(parsed)
    return []


def _dict(value: object) -> dict[str, object]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def build_dedupe_key(candidate: dict[str, object]) -> str:
    parts = [
        str(candidate.get("company_name") or "").strip().lower(),
        str(candidate.get("role_title") or "").strip().lower(),
        str(candidate.get("contact_channel_value") or "").strip().lower(),
        str(candidate.get("application_url") or candidate.get("source_url") or "").strip().lower(),
    ]
    return "|".join(part for part in parts if part)[:1000]


def existing_opportunity_id(db: Session, user_id: str, dedupe_key: str) -> str | None:
    row = db.execute(
        text(
            """
            SELECT o.id
            FROM opportunities o
            JOIN job_opportunity_details d ON d.opportunity_id = o.id
            WHERE o.user_id = :user_id AND d.dedupe_key = :dedupe_key
            LIMIT 1
            """
        ),
        {"user_id": user_id, "dedupe_key": dedupe_key},
    ).mappings().first()
    return str(row["id"]) if row else None


def insert_opportunity(db: Session, run: dict[str, Any], candidate: dict[str, object], dedupe_key: str) -> str:
    opportunity_id = new_id()
    detail_id = new_id()
    now = datetime.now(UTC)
    review_profile = _dict(candidate.get("review_profile"))
    contact_type = str(candidate.get("contact_channel_type") or "other_public_contact")
    contact_value = str(candidate.get("contact_channel_value") or "")
    contact_email = str(candidate.get("contact_email") or "") if contact_type == "email" else None
    source_evidence = str(candidate.get("source_evidence") or candidate.get("raw_excerpt") or "")
    db.execute(
        text(
            """
            INSERT INTO opportunities (
              id, user_id, opportunity_type, title, organization_name, source_name, source_url,
              source_query, source_evidence, captured_at, created_at, updated_at
            )
            VALUES (
              :id, :user_id, 'job', :title, :organization_name, :source_name, :source_url,
              :source_query, :source_evidence, :now, :now, :now
            )
            """
        ),
        {
            "id": opportunity_id,
            "user_id": run["user_id"],
            "title": str(candidate.get("role_title") or candidate.get("post_headline") or "")[:500],
            "organization_name": str(candidate.get("company_name") or "")[:255],
            "source_name": str(candidate.get("source_name") or "Career pages")[:100],
            "source_url": str(candidate.get("source_url") or ""),
            "source_query": str(candidate.get("source_query") or run.get("search_query") or ""),
            "source_evidence": source_evidence,
            "now": now,
        },
    )
    db.execute(
        text(
            """
            INSERT INTO job_opportunity_details (
              id, opportunity_id, company_name, role_title, post_headline, job_description,
              contact_channel_type, contact_channel_value, contact_email, application_url,
              matched_keywords, dedupe_key, job_stage, review_status, match_score,
              score_explanation, score_factors, analysis_status, analysis_confidence,
              normalized_company_name, normalized_role_title, detected_seniority,
              detected_modality, detected_location, missing_keywords,
              historical_similarity_signals, created_at, updated_at
            )
            VALUES (
              :id, :opportunity_id, :company_name, :role_title, :post_headline, :job_description,
              :contact_channel_type, :contact_channel_value, :contact_email, :application_url,
              :matched_keywords, :dedupe_key, 'new', :review_status, :match_score,
              :score_explanation, :score_factors, :analysis_status, :analysis_confidence,
              :normalized_company_name, :normalized_role_title, :detected_seniority,
              :detected_modality, :detected_location, :missing_keywords,
              :historical_similarity_signals, :now, :now
            )
            """
        ),
        {
            "id": detail_id,
            "opportunity_id": opportunity_id,
            "company_name": str(candidate.get("company_name") or "")[:255],
            "role_title": str(candidate.get("role_title") or "")[:500],
            "post_headline": str(candidate.get("post_headline") or "")[:500],
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": contact_type,
            "contact_channel_value": contact_value,
            "contact_email": contact_email,
            "application_url": str(candidate.get("application_url") or ""),
            "matched_keywords": _json(candidate.get("matched_keywords") or []),
            "dedupe_key": dedupe_key,
            "review_status": str(review_profile.get("review_status") or "unreviewed"),
            "match_score": review_profile.get("match_score"),
            "score_explanation": review_profile.get("score_explanation"),
            "score_factors": _json(review_profile.get("score_factors") or {}),
            "analysis_status": str(review_profile.get("analysis_status") or "deterministic_only"),
            "analysis_confidence": review_profile.get("analysis_confidence"),
            "normalized_company_name": str(review_profile.get("normalized_company_name") or candidate.get("company_name") or "")[:255],
            "normalized_role_title": str(review_profile.get("normalized_role_title") or candidate.get("role_title") or "")[:500],
            "detected_seniority": review_profile.get("detected_seniority"),
            "detected_modality": review_profile.get("detected_modality"),
            "detected_location": review_profile.get("detected_location"),
            "missing_keywords": _json(review_profile.get("missing_keywords") or []),
            "historical_similarity_signals": _json(review_profile.get("historical_similarity_signals") or {}),
            "now": now,
        },
    )
    return opportunity_id


def insert_candidate(db: Session, run: dict[str, Any], candidate: dict[str, object], *, outcome: str, opportunity_id: str | None, dedupe_key: str, rejection_reason: str | None = None) -> None:
    review_profile = _dict(candidate.get("review_profile"))
    db.execute(
        text(
            """
            INSERT INTO job_search_candidates (
              id, user_id, run_id, opportunity_id, outcome, company_name, role_title, post_headline,
              job_description, contact_channel_type, contact_channel_value, collection_source_type,
              provider_name, provider_status, source_url, source_query, source_evidence,
              matched_keywords, match_score, score_explanation, score_factors, analysis_status,
              analysis_confidence, analysis_error_code, analysis_error_message, ai_model_name,
              ai_prompt_version, normalized_company_name, normalized_role_title, detected_seniority,
              detected_modality, detected_location, missing_keywords, historical_similarity_signals,
              raw_excerpt, dedupe_key, rejection_reason, inspected_at, created_at, application_url,
              application_kind, selected_source_key, source_name, provider_metadata, external_job_id
            )
            VALUES (
              :id, :user_id, :run_id, :opportunity_id, :outcome, :company_name, :role_title, :post_headline,
              :job_description, :contact_channel_type, :contact_channel_value, :collection_source_type,
              :provider_name, :provider_status, :source_url, :source_query, :source_evidence,
              :matched_keywords, :match_score, :score_explanation, :score_factors, :analysis_status,
              :analysis_confidence, :analysis_error_code, :analysis_error_message, :ai_model_name,
              :ai_prompt_version, :normalized_company_name, :normalized_role_title, :detected_seniority,
              :detected_modality, :detected_location, :missing_keywords, :historical_similarity_signals,
              :raw_excerpt, :dedupe_key, :rejection_reason, :now, :now, :application_url,
              :application_kind, :selected_source_key, :source_name, :provider_metadata, :external_job_id
            )
            """
        ),
        {
            "id": new_id(),
            "user_id": run["user_id"],
            "run_id": run["id"],
            "opportunity_id": opportunity_id,
            "outcome": outcome,
            "company_name": str(candidate.get("company_name") or "")[:255],
            "role_title": str(candidate.get("role_title") or "")[:500],
            "post_headline": str(candidate.get("post_headline") or "")[:500],
            "job_description": str(candidate.get("job_description") or ""),
            "contact_channel_type": str(candidate.get("contact_channel_type") or ""),
            "contact_channel_value": str(candidate.get("contact_channel_value") or ""),
            "collection_source_type": "career_page",
            "provider_name": str(candidate.get("provider_name") or "serpapi"),
            "provider_status": str(candidate.get("provider_status") or "collected"),
            "source_url": str(candidate.get("source_url") or ""),
            "source_query": str(candidate.get("source_query") or run.get("search_query") or ""),
            "source_evidence": str(candidate.get("source_evidence") or ""),
            "matched_keywords": _json(candidate.get("matched_keywords") or []),
            "match_score": review_profile.get("match_score") if outcome == "accepted" else None,
            "score_explanation": review_profile.get("score_explanation") if outcome == "accepted" else None,
            "score_factors": _json(review_profile.get("score_factors") or {}),
            "analysis_status": str(review_profile.get("analysis_status") or "deterministic_only") if outcome == "accepted" else "skipped",
            "analysis_confidence": review_profile.get("analysis_confidence") if outcome == "accepted" else None,
            "analysis_error_code": review_profile.get("analysis_error_code"),
            "analysis_error_message": review_profile.get("analysis_error_message"),
            "ai_model_name": candidate.get("ai_model_name"),
            "ai_prompt_version": candidate.get("ai_prompt_version"),
            "normalized_company_name": str(review_profile.get("normalized_company_name") or candidate.get("company_name") or "")[:255],
            "normalized_role_title": str(review_profile.get("normalized_role_title") or candidate.get("role_title") or "")[:500],
            "detected_seniority": review_profile.get("detected_seniority"),
            "detected_modality": review_profile.get("detected_modality"),
            "detected_location": review_profile.get("detected_location"),
            "missing_keywords": _json(review_profile.get("missing_keywords") or []),
            "historical_similarity_signals": _json(review_profile.get("historical_similarity_signals") or {}),
            "raw_excerpt": str(candidate.get("raw_excerpt") or "")[:1000],
            "dedupe_key": dedupe_key,
            "rejection_reason": rejection_reason,
            "application_url": str(candidate.get("application_url") or ""),
            "application_kind": str(candidate.get("application_kind") or ""),
            "selected_source_key": str(candidate.get("selected_source_key") or ""),
            "source_name": str(candidate.get("source_name") or ""),
            "provider_metadata": _json(candidate.get("provider_metadata") or {}),
            "external_job_id": str(candidate.get("external_job_id") or ""),
            "now": datetime.now(UTC),
        },
    )


def update_run_counts(db: Session, run_id: str, *, diagnostics: dict[str, object], stop_reason: str | None, provider_status: str) -> None:
    counts = db.execute(
        text(
            """
            SELECT
              COUNT(*) AS inspected,
              SUM(CASE WHEN outcome = 'accepted' THEN 1 ELSE 0 END) AS accepted,
              SUM(CASE WHEN outcome LIKE 'rejected%' THEN 1 ELSE 0 END) AS rejected,
              SUM(CASE WHEN outcome = 'duplicate' THEN 1 ELSE 0 END) AS duplicates
            FROM job_search_candidates
            WHERE run_id = :run_id
            """
        ),
        {"run_id": run_id},
    ).mappings().one()
    accepted = int(counts["accepted"] or 0)
    status = "completed" if accepted else "completed_no_results"
    db.execute(
        text(
            """
            UPDATE job_search_runs
            SET status = :status,
                inspected_count = :inspected,
                accepted_count = :accepted,
                rejected_count = :rejected,
                duplicate_count = :duplicates,
                cap_reached = :cap_reached,
                provider_status = :provider_status,
                source_diagnostics = :diagnostics,
                stop_reason = :stop_reason,
                completed_at = :now,
                updated_at = :now
            WHERE id = :run_id
            """
        ),
        {
            "run_id": run_id,
            "status": status,
            "inspected": int(counts["inspected"] or 0),
            "accepted": accepted,
            "rejected": int(counts["rejected"] or 0),
            "duplicates": int(counts["duplicates"] or 0),
            "cap_reached": stop_reason in {"accepted_limit", "inspected_cap"},
            "provider_status": provider_status,
            "diagnostics": _json(diagnostics),
            "stop_reason": stop_reason,
            "now": datetime.now(UTC),
        },
    )


def process_one_run(db: Session, pending_run: dict[str, Any], settings: WorkerSettings | None = None) -> bool:
    settings = settings or get_worker_settings()
    run = claim_pending_run(db, str(pending_run["id"]))
    if run is None:
        return False

    selected_keys = _list(run.get("selected_source_keys")) or active_source_keys()
    sources = source_by_key()
    accepted_limit = int(run.get("accepted_limit") or settings.career_page_default_accepted_limit)
    inspected_cap = int(run.get("inspected_cap") or settings.career_page_default_inspected_cap)
    accepted_count = 0
    inspected_count = 0
    diagnostics: dict[str, object] = {}
    stop_reason: str | None = None

    try:
        log_event(
            "career_page_provider_start",
            run_id=run["id"],
            selected_source_keys=selected_keys,
            accepted_limit=accepted_limit,
            inspected_cap=inspected_cap,
        )
        for source_key in selected_keys:
            source = sources.get(source_key)
            if source is None:
                diagnostics[source_key] = {"status": "unknown_source", "accepted": 0, "inspected": 0}
                continue
            source_accepted = 0
            source_inspected = 0
            try:
                results = fetch_serpapi_results(source=source, keywords=_list(run.get("requested_keywords")), search_query=run.get("search_query"), settings=settings)
                log_event("career_page_source_progress", run_id=run["id"], source_key=source_key, result_count=len(results))
                for result in results:
                    if inspected_count >= inspected_cap:
                        stop_reason = "inspected_cap"
                        log_event("career_page_cap_reached", run_id=run["id"], stop_reason=stop_reason, inspected_count=inspected_count)
                        break
                    if accepted_count >= accepted_limit:
                        stop_reason = "accepted_limit"
                        log_event("career_page_cap_reached", run_id=run["id"], stop_reason=stop_reason, accepted_count=accepted_count)
                        break
                    candidate = normalize_external_job_result(
                        result,
                        requested_keywords=_list(run.get("requested_keywords")),
                        ai_enabled=bool(run.get("analysis_enabled")),
                        max_age_days=settings.career_page_result_max_age_days,
                    )
                    dedupe_key = build_dedupe_key(candidate)
                    existing_id = existing_opportunity_id(db, str(run["user_id"]), dedupe_key)
                    if existing_id:
                        insert_candidate(db, run, candidate, outcome="duplicate", opportunity_id=existing_id, dedupe_key=dedupe_key)
                        log_event("career_page_candidate_duplicate", run_id=run["id"], source_key=source_key, source_url=candidate.get("source_url"))
                    elif candidate.get("outcome_hint") == "rejected_weak_match":
                        insert_candidate(db, run, candidate, outcome="rejected_weak_match", opportunity_id=None, dedupe_key=dedupe_key, rejection_reason=str(candidate.get("rejection_reason") or "Rejected"))
                        log_event("career_page_candidate_rejected", run_id=run["id"], source_key=source_key, reason=candidate.get("rejection_reason"))
                    else:
                        opportunity_id = insert_opportunity(db, run, candidate, dedupe_key)
                        insert_candidate(db, run, candidate, outcome="accepted", opportunity_id=opportunity_id, dedupe_key=dedupe_key)
                        accepted_count += 1
                        source_accepted += 1
                        log_event("career_page_candidate_accepted", run_id=run["id"], source_key=source_key, opportunity_id=opportunity_id)
                    inspected_count += 1
                    source_inspected += 1
                    log_event("career_page_candidate_inspected", run_id=run["id"], source_key=source_key, inspected_count=inspected_count)
                diagnostics[source_key] = {"status": "collected", "accepted": source_accepted, "inspected": source_inspected}
            except Exception as exc:
                diagnostics[source_key] = {"status": "failed", "error": str(exc), "accepted": source_accepted, "inspected": source_inspected}
            if stop_reason:
                break
        provider_status = "partial" if any(_dict(value).get("status") == "failed" for value in diagnostics.values()) else "collected"
        update_run_counts(db, str(run["id"]), diagnostics=diagnostics, stop_reason=stop_reason or "source_exhausted", provider_status=provider_status)
        db.commit()
        log_event("career_page_run_terminal", run_id=run["id"], provider_status=provider_status, stop_reason=stop_reason or "source_exhausted")
        return True
    except Exception as exc:
        db.execute(
            text(
                """
                UPDATE job_search_runs
                SET status = 'failed', provider_status = 'failed', provider_error_code = 'worker_failed',
                    provider_error_message = :message, error_message = :message, completed_at = :now, updated_at = :now
                WHERE id = :run_id
                """
            ),
            {"run_id": run["id"], "message": str(exc), "now": datetime.now(UTC)},
        )
        db.commit()
        return False


def process_pending_runs(
    db: Session | None = None,
    *,
    settings: WorkerSettings | None = None,
    run_once: bool | None = None,
) -> int:
    settings = settings or get_worker_settings()
    owns_session = db is None
    db = db or new_session()
    try:
        pending_runs = select_pending_runs(db, settings.worker_max_runs_per_loop)
        processed = 0
        for pending_run in pending_runs:
            if process_one_run(db, pending_run, settings=settings):
                processed += 1
        return processed
    finally:
        if owns_session:
            db.close()
