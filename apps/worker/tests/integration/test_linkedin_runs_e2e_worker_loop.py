from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import process_pending_runs


def test_processes_api_created_pending_run_with_supplied_public_content(db_session: Session) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, hiring_intent_terms, collection_source_types,
                provided_source_count, source_name, candidate_limit, inspected_count, accepted_count,
                rejected_count, duplicate_count, cap_reached, provider_status, created_at, updated_at
            )
            VALUES (
                'run-1', 'pending', :keywords, :terms, :sources, 1, 'LinkedIn', 1, 0, 0, 0, 0,
                false, 'not_started', :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["provided_public_content"]),
            "now": now,
        },
    )
    db_session.execute(
        text(
            """
            INSERT INTO linkedin_collection_inputs (
                id, run_id, source_type, source_url, provided_text, label, created_at
            )
            VALUES (
                'input-1', 'run-1', 'provided_public_content',
                'https://www.linkedin.com/feed/update/example',
                'Example Co is hiring a TypeScript developer. Email jobs@example.com',
                'manual-linkedin-post',
                :now
            )
            """
        ),
        {"now": now},
    )
    db_session.commit()

    assert process_pending_runs(db_session, run_once=True) == 1

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'run-1'")).mappings().one()
    candidates = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'run-1'")).mappings().all()
    opportunities = db_session.execute(text("SELECT * FROM opportunities")).mappings().all()

    assert run["status"] == "completed"
    assert run["provider_status"] == "collected"
    assert run["inspected_count"] == 1
    assert run["accepted_count"] == 1
    assert len(candidates) == 1
    assert candidates[0]["user_id"] == "user-1"
    assert candidates[0]["outcome"] == "accepted"
    assert len(opportunities) == 1
    assert opportunities[0]["user_id"] == "user-1"
