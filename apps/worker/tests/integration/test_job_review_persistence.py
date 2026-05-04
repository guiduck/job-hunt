from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import process_pending_runs


def test_worker_persists_review_fields_for_accepted_candidate(db_session: Session) -> None:
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
                'review-run', 'pending', :keywords, :terms, :sources, 1, 'LinkedIn', 1, 0, 0, 0, 0,
                false, 'not_started', :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["typescript", "reactjs", "python"]),
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
                'review-run-input', 'review-run', 'provided_public_content',
                'https://www.linkedin.com/feed/update/example-review',
                'We are hiring a Senior TypeScript Developer for a remote React product role. Email jobs@example.com',
                'manual-review-post',
                :now
            )
            """
        ),
        {"now": now},
    )
    db_session.commit()

    assert process_pending_runs(db_session, run_once=True) == 1

    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'review-run'")).mappings().one()
    assert candidate["outcome"] == "accepted"
    assert candidate["match_score"] is not None
    assert candidate["analysis_status"] == "deterministic_only"
    assert "python" in json.loads(candidate["missing_keywords"])

    detail = db_session.execute(text("SELECT * FROM job_opportunity_details")).mappings().one()
    assert detail["review_status"] == "unreviewed"
    assert detail["match_score"] == candidate["match_score"]
    assert detail["analysis_status"] == "deterministic_only"
