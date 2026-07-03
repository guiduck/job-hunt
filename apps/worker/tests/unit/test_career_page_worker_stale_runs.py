from datetime import UTC, datetime, timedelta
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.career_page_job_search import recover_stale_running_runs


def insert_running_run(db: Session, run_id: str, *, search_kind: str, started_at: datetime) -> None:
    db.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, search_kind, status, requested_keywords, search_query, hiring_intent_terms,
                collection_source_types, selected_source_keys, source_diagnostics, provided_source_count,
                source_name, candidate_limit, accepted_limit, inspected_cap, provider_metadata,
                inspected_count, accepted_count, rejected_count, duplicate_count, cap_reached,
                provider_status, started_at, created_at, updated_at
            )
            VALUES (
                :id, :search_kind, 'running', :keywords, 'react remote', :terms,
                :sources, :selected_source_keys, :source_diagnostics, 0,
                'Career pages', 200, 30, 200, :provider_metadata,
                0, 0, 0, 0, false,
                'not_started', :started_at, :started_at, :started_at
            )
            """
        ),
        {
            "id": run_id,
            "search_kind": search_kind,
            "keywords": json.dumps(["react"]),
            "terms": json.dumps([]),
            "sources": json.dumps([]),
            "selected_source_keys": json.dumps(["ashby"]),
            "source_diagnostics": json.dumps({"ashby": {"status": "fetching"}}),
            "provider_metadata": json.dumps({"provider": "serpapi"}),
            "started_at": started_at,
        },
    )


def test_recover_stale_running_runs_only_marks_career_page_runs(db_session: Session) -> None:
    now = datetime.now(UTC)
    insert_running_run(db_session, "career-stale-run", search_kind="career_page", started_at=now)
    insert_running_run(db_session, "linkedin-running-run", search_kind="linkedin", started_at=now)
    db_session.commit()

    assert recover_stale_running_runs(db_session) == 1

    rows = {
        row["id"]: row
        for row in db_session.execute(
            text("SELECT id, status, provider_status, provider_error_code FROM job_search_runs ORDER BY id")
        ).mappings()
    }
    assert rows["career-stale-run"]["status"] == "failed"
    assert rows["career-stale-run"]["provider_status"] == "failed"
    assert rows["career-stale-run"]["provider_error_code"] == "stale_running"
    assert rows["linkedin-running-run"]["status"] == "running"


def test_recover_stale_running_runs_respects_timeout_threshold(db_session: Session) -> None:
    now = datetime.now(UTC)
    insert_running_run(db_session, "career-fresh-run", search_kind="career_page", started_at=now - timedelta(minutes=10))
    insert_running_run(db_session, "career-timeout-run", search_kind="career_page", started_at=now - timedelta(minutes=120))
    db_session.commit()

    assert (
        recover_stale_running_runs(
            db_session,
            older_than_minutes=90,
            provider_error_code="running_timeout",
            message="Career-page run exceeded the worker running timeout.",
        )
        == 1
    )

    rows = {
        row["id"]: row
        for row in db_session.execute(text("SELECT id, status, provider_error_code FROM job_search_runs ORDER BY id")).mappings()
    }
    assert rows["career-fresh-run"]["status"] == "running"
    assert rows["career-timeout-run"]["status"] == "failed"
    assert rows["career-timeout-run"]["provider_error_code"] == "running_timeout"
