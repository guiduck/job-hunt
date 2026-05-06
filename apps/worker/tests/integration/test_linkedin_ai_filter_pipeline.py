from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.jobs.linkedin_job_search import process_pending_runs


def test_enabled_ai_filters_without_provider_fallback_and_create_opportunity(db_session: Session) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, search_query, search_sort_order, hiring_intent_terms,
                collection_source_types, provided_source_count, source_name, candidate_limit,
                inspected_count, accepted_count, rejected_count, duplicate_count, cap_reached,
                provider_status, ai_filters_enabled, ai_filter_settings, created_at, updated_at
            )
            VALUES (
                'run-ai-1', 'pending', :keywords, 'hiring typescript', 'recent', :terms,
                :sources, 1, 'LinkedIn', 1, 0, 0, 0, 0, false, 'not_started', true, :settings, :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["provided_public_content"]),
            "settings": json.dumps({"remote_only": True, "excluded_regions": ["India"]}),
            "now": now,
        },
    )
    db_session.execute(
        text(
            """
            INSERT INTO linkedin_collection_inputs (id, run_id, source_type, source_url, provided_text, label, created_at)
            VALUES (
                'input-ai-1', 'run-ai-1', 'provided_public_content',
                'https://www.linkedin.com/feed/update/example',
                'Example Co is hiring a remote TypeScript developer for LATAM. Email jobs@example.com',
                'manual-linkedin-post',
                :now
            )
            """
        ),
        {"now": now},
    )
    db_session.commit()

    assert process_pending_runs(db_session, run_once=True) == 1

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'run-ai-1'")).mappings().one()
    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'run-ai-1'")).mappings().one()

    assert run["accepted_count"] == 1
    assert run["ai_filter_fallback_count"] == 1
    assert candidate["ai_filter_status"] == "fallback"
    assert candidate["outcome"] == "accepted"


def test_fallback_keeps_legacy_acceptance_and_evidence(db_session: Session) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, search_query, search_sort_order, hiring_intent_terms,
                collection_source_types, provided_source_count, source_name, candidate_limit,
                inspected_count, accepted_count, rejected_count, duplicate_count, cap_reached,
                provider_status, ai_filters_enabled, ai_filter_settings, created_at, updated_at
            )
            VALUES (
                'run-ai-2', 'pending', :keywords, 'hiring typescript', 'recent', :terms,
                :sources, 1, 'LinkedIn', 1, 0, 0, 0, 0, false, 'not_started', true, :settings, :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["typescript"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["provided_public_content"]),
            "settings": json.dumps({"remote_only": True, "excluded_regions": ["India"]}),
            "now": now,
        },
    )
    evidence = "Example Co is hiring a remote TypeScript developer. Email jobs@example.com"
    db_session.execute(
        text(
            """
            INSERT INTO linkedin_collection_inputs (id, run_id, source_type, source_url, provided_text, label, created_at)
            VALUES ('input-ai-2', 'run-ai-2', 'provided_public_content', 'https://www.linkedin.com/feed/update/example-2', :evidence, 'manual-linkedin-post', :now)
            """
        ),
        {"evidence": evidence, "now": now},
    )
    db_session.commit()

    assert process_pending_runs(db_session, run_once=True) == 1

    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'run-ai-2'")).mappings().one()
    assert candidate["outcome"] == "accepted"
    assert candidate["ai_filter_status"] == "fallback"
    assert candidate["source_evidence"] == evidence
