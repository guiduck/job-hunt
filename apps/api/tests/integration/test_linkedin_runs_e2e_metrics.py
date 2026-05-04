from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, record_candidate


def test_run_counter_reconciliation_across_candidate_outcomes(db_session: Session) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"], candidate_limit=3))

    record_candidate(
        db_session,
        run,
        {
            "contact_channel_type": "email",
            "contact_channel_value": "jobs@example.com",
            "source_query": "hiring typescript",
            "source_evidence": "We're hiring a TypeScript developer. Email jobs@example.com",
            "matched_keywords": ["typescript"],
            "provider_status": "collected",
        },
    )
    record_candidate(
        db_session,
        run,
        {
            "source_query": "hiring python",
            "source_evidence": "We're hiring a Python developer.",
            "matched_keywords": [],
            "provider_status": "collected",
        },
    )
    record_candidate(
        db_session,
        run,
        {
            "source_query": "hiring typescript",
            "matched_keywords": [],
            "provider_status": "blocked",
            "provider_error_code": "blocked",
            "rejection_reason": "LinkedIn source blocked",
        },
    )

    assert run.inspected_count == 3
    assert run.accepted_count == 1
    assert run.rejected_count == 2
    assert run.duplicate_count == 0
    assert run.cap_reached is True
    assert run.provider_status == "partial"
