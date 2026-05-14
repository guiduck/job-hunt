from datetime import UTC, datetime, timedelta
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


def test_recover_stale_running_runs_respects_timeout_threshold(db_session: Session) -> None:
    now = datetime.now(UTC)
    for run_id, started_at in {
        "fresh-run": now - timedelta(minutes=10),
        "timed-out-run": now - timedelta(minutes=120),
    }.items():
        db_session.execute(
            text(
                """
                INSERT INTO job_search_runs (
                    id, status, requested_keywords, hiring_intent_terms, collection_source_types,
                    provided_source_count, source_name, candidate_limit, inspected_count, accepted_count,
                    rejected_count, duplicate_count, cap_reached, provider_status, started_at, created_at, updated_at
                )
                VALUES (
                    :id, 'running', :keywords, :terms, :sources, 0, 'LinkedIn', 50, 0, 0, 0, 0,
                    false, 'not_started', :started_at, :started_at, :started_at
                )
                """
            ),
            {
                "id": run_id,
                "keywords": json.dumps(["typescript"]),
                "terms": json.dumps(["hiring"]),
                "sources": json.dumps(["authenticated_browser_search"]),
                "started_at": started_at,
            },
        )
    db_session.commit()

    assert (
        recover_stale_running_runs(
            db_session,
            older_than_minutes=90,
            provider_error_code="running_timeout",
            message="Run exceeded the worker running timeout.",
        )
        == 1
    )

    rows = {
        row["id"]: row
        for row in db_session.execute(
            text("SELECT id, status, provider_error_code FROM job_search_runs ORDER BY id")
        ).mappings()
    }
    assert rows["fresh-run"]["status"] == "running"
    assert rows["timed-out-run"]["status"] == "failed"
    assert rows["timed-out-run"]["provider_error_code"] == "running_timeout"
