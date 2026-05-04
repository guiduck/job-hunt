from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import finalize_run, record_candidate


def test_provider_failure_outcomes_create_zero_opportunities(db_session: Session) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, hiring_intent_terms, collection_source_types,
                provided_source_count, source_name, candidate_limit, inspected_count, accepted_count,
                rejected_count, duplicate_count, cap_reached, provider_status, started_at, created_at, updated_at
            )
            VALUES (
                'failure-run', 'running', :keywords, :terms, :sources, 0, 'LinkedIn', 50, 0, 0, 0, 0,
                false, 'not_started', :now, :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["automatic_publication_search"]),
            "now": now,
        },
    )
    db_session.commit()
    candidates = [
        {
            "outcome": "blocked_source",
            "provider_status": "blocked",
            "provider_error_code": "blocked",
            "source_query": "hiring typescript",
            "matched_keywords": [],
            "rejection_reason": "LinkedIn source blocked",
        }
    ]

    for candidate in candidates:
        record_candidate(db_session, "failure-run", candidate)
    finalize_run(db_session, "failure-run", candidates)

    opportunity_count = db_session.execute(text("SELECT count(*) FROM opportunities")).scalar_one()
    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'failure-run'")).mappings().one()

    assert opportunity_count == 0
    assert run["status"] == "completed_no_results"
    assert run["provider_status"] == "blocked"
    assert run["rejected_count"] == 1
