from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import recover_stale_running_runs


def test_recover_stale_running_runs_marks_failed_without_reprocessing(db_session: Session) -> None:
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
                'stale-run', 'running', :keywords, :terms, :sources, 0, 'LinkedIn', 50, 0, 0, 0, 0,
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

    assert recover_stale_running_runs(db_session) == 1
    row = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'stale-run'")).mappings().one()

    assert row["status"] == "failed"
    assert row["provider_status"] == "failed"
    assert row["provider_error_code"] == "stale_running"
    assert row["completed_at"] is not None
