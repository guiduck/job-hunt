from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import claim_pending_run, process_pending_runs, select_pending_runs


def insert_run(db: Session, run_id: str, status: str = "pending") -> None:
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, hiring_intent_terms, collection_source_types,
                provided_source_count, source_name, candidate_limit, inspected_count, accepted_count,
                rejected_count, duplicate_count, cap_reached, provider_status, created_at, updated_at
            )
            VALUES (
                :id, :status, :keywords, :terms, :sources, 0, 'LinkedIn', 50, 0, 0, 0, 0,
                false, 'not_started', :now, :now
            )
            """
        ),
        {
            "id": run_id,
            "status": status,
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["provided_public_content"]),
            "now": now,
        },
    )
    db.commit()


def test_select_pending_runs_ignores_non_pending(db_session: Session) -> None:
    insert_run(db_session, "pending-run", "pending")
    insert_run(db_session, "completed-run", "completed")

    rows = select_pending_runs(db_session, limit=10)

    assert [row["id"] for row in rows] == ["pending-run"]


def test_claim_pending_run_sets_running_and_started_at(db_session: Session) -> None:
    insert_run(db_session, "pending-run", "pending")

    claimed = claim_pending_run(db_session, "pending-run")

    assert claimed is not None
    assert claimed["status"] == "running"
    assert claimed["started_at"] is not None


def test_run_once_returns_without_pending_runs(db_session: Session) -> None:
    assert process_pending_runs(db_session, run_once=True) == 0
