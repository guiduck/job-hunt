from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, get_job_search_run, record_candidate


def test_ai_filter_counters_reconcile_service_created_candidates(
    db_session: Session,
    ai_filter_candidate_payload: dict[str, object],
) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))
    record_candidate(db_session, run, ai_filter_candidate_payload)
    record_candidate(
        db_session,
        run,
        {
            **ai_filter_candidate_payload,
            "contact_channel_value": "reject@example.com",
            "ai_filter_status": "rejected",
            "passes_ai_filter": False,
            "ai_filter_reason": "Onsite role.",
        },
    )
    record_candidate(
        db_session,
        run,
        {
            **ai_filter_candidate_payload,
            "contact_channel_value": "fallback@example.com",
            "ai_filter_status": "fallback",
            "passes_ai_filter": True,
            "ai_filter_error_code": "ai_not_configured",
        },
    )
    record_candidate(
        db_session,
        run,
        {
            **ai_filter_candidate_payload,
            "contact_channel_value": "failed@example.com",
            "ai_filter_status": "failed",
            "passes_ai_filter": None,
            "ai_filter_error_code": "provider_failed",
        },
    )
    record_candidate(
        db_session,
        run,
        {
            **ai_filter_candidate_payload,
            "ai_filter_status": "skipped",
            "passes_ai_filter": None,
        },
    )

    refreshed = get_job_search_run(db_session, run.id)

    assert refreshed is not None
    assert refreshed.ai_filter_passed_count == 1
    assert refreshed.ai_filter_rejected_count == 1
    assert refreshed.ai_filter_fallback_count == 1
    assert refreshed.ai_filter_failed_count == 1
    assert refreshed.ai_filter_skipped_count == 1
    assert refreshed.duplicate_count == 1
    assert refreshed.ai_filter_status == "failed"
