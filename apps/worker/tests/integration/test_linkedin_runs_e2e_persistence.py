from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import process_pending_runs


def insert_pending_supplied_run(db: Session, run_id: str, provided_text: str) -> None:
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
                :run_id, 'pending', :keywords, :terms, :sources, 1, 'LinkedIn', 1, 0, 0, 0, 0,
                false, 'not_started', :now, :now
            )
            """
        ),
        {
            "run_id": run_id,
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["provided_public_content"]),
            "now": now,
        },
    )
    db.execute(
        text(
            """
            INSERT INTO linkedin_collection_inputs (
                id, run_id, source_type, source_url, provided_text, label, created_at
            )
            VALUES (:input_id, :run_id, 'provided_public_content', :source_url, :provided_text, :label, :now)
            """
        ),
        {
            "input_id": f"{run_id}-input",
            "run_id": run_id,
            "source_url": "https://www.linkedin.com/feed/update/example",
            "provided_text": provided_text,
            "label": f"{run_id}-manual-post",
            "now": now,
        },
    )
    db.commit()


def test_persists_accepted_email_and_linkedin_contact_candidates(db_session: Session) -> None:
    insert_pending_supplied_run(
        db_session,
        "email-run",
        "Example Co is hiring a TypeScript developer. Email jobs@example.com",
    )
    insert_pending_supplied_run(
        db_session,
        "linkedin-run",
        (
            "Example Co is hiring a TypeScript developer. Reach out to me on LinkedIn. "
            "https://www.linkedin.com/in/recruiter-example"
        ),
    )

    assert process_pending_runs(db_session, run_once=True) == 1
    assert process_pending_runs(db_session, run_once=True) == 1

    rows = db_session.execute(
        text("SELECT run_id, outcome, contact_channel_type FROM job_search_candidates ORDER BY run_id")
    ).mappings().all()

    assert [row["outcome"] for row in rows] == ["accepted", "accepted"]
    assert {row["contact_channel_type"] for row in rows} == {"email", "linkedin"}
