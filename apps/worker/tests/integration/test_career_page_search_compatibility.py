from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import WorkerSettings
from app.jobs.linkedin_job_search import process_pending_runs


def test_linkedin_worker_ignores_career_page_config_and_processes_linkedin(db_session: Session) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, status, requested_keywords, search_query, search_sort_order, hiring_intent_terms,
                collection_source_types, selected_source_keys, source_diagnostics, provided_source_count,
                source_name, candidate_limit, inspected_count, accepted_count, rejected_count,
                duplicate_count, cap_reached, provider_status, ai_filters_enabled, ai_filter_settings,
                created_at, updated_at
            )
            VALUES (
                'linkedin-compat-run', 'pending', :keywords, 'hiring typescript', 'recent', :terms,
                :sources, '[]', '{}', 1, 'LinkedIn', 1, 0, 0, 0, 0, false, 'not_started',
                false, '{}', :now, :now
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
            INSERT INTO linkedin_collection_inputs (id, run_id, source_type, source_url, provided_text, label, created_at)
            VALUES (
                'linkedin-compat-input', 'linkedin-compat-run', 'provided_public_content',
                'https://www.linkedin.com/feed/update/compat',
                'Example Co is hiring TypeScript engineers. Email jobs@example.com',
                'manual-linkedin-post',
                :now
            )
            """
        ),
        {"now": now},
    )
    db_session.commit()

    processed = process_pending_runs(
        db_session,
        settings=WorkerSettings(serpapi_api_key=None, job_ai_filters_enabled=False, worker_max_runs_per_loop=1),
        run_once=True,
    )

    assert processed == 1
    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'linkedin-compat-run'")).mappings().one()
    assert run["status"] == "completed"
    assert run["accepted_count"] == 1
