from datetime import UTC, datetime
import json

from sqlalchemy import text

from app.jobs.linkedin_job_search import apply_ai_filters, finalize_run, update_running_run_progress


def test_finalize_run_counts_ai_filter_statuses(db_session) -> None:
    candidates = [
        {"outcome": "accepted", "provider_status": "collected", "analysis_status": "deterministic_only", "ai_filter_status": "passed"},
        {"outcome": "rejected_ai_filter", "provider_status": "collected", "analysis_status": "skipped", "ai_filter_status": "rejected"},
        {"outcome": "duplicate", "provider_status": "collected", "analysis_status": "skipped", "ai_filter_status": "skipped"},
    ]

    finalize_run(db_session, "missing-run-ok-for-count-sql", candidates)

    # The SQL update is intentionally tolerant of zero affected rows in worker tests.
    assert candidates[0]["ai_filter_status"] == "passed"


def test_duplicate_and_provider_failure_candidates_are_skipped_not_ai_rejected() -> None:
    candidates = [
        {"outcome": "duplicate", "source_evidence": "Remote TypeScript role", "matched_keywords": ["typescript"]},
        {"outcome": "failed_provider", "provider_status": "failed", "source_evidence": "", "matched_keywords": []},
    ]

    filtered = apply_ai_filters(candidates, enabled=True, settings_payload={"remote_only": True})

    assert [candidate["ai_filter_status"] for candidate in filtered] == ["skipped", "skipped"]
    assert [candidate["outcome"] for candidate in filtered] == ["duplicate", "failed_provider"]


def test_running_run_progress_is_persisted_before_finalization(db_session) -> None:
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
                'run-progress', 'running', :keywords, 'react remoto', 'recent', :terms,
                :sources, 3, 'LinkedIn', 50, 0, 0, 0, 0, false, 'running', true, :settings, :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["react", "remoto"]),
            "terms": json.dumps(["hiring"]),
            "sources": json.dumps(["linkedin_search"]),
            "settings": json.dumps({"remote_only": True}),
            "now": now,
        },
    )

    update_running_run_progress(
        db_session,
        "run-progress",
        [
            {"outcome": "accepted", "ai_filter_status": "passed"},
            {"outcome": "rejected_ai_filter", "ai_filter_status": "rejected"},
            {"outcome": "duplicate", "ai_filter_status": "skipped"},
        ],
    )
    db_session.commit()

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'run-progress'")).mappings().one()

    assert run["status"] == "running"
    assert run["inspected_count"] == 3
    assert run["accepted_count"] == 1
    assert run["rejected_count"] == 1
    assert run["duplicate_count"] == 1
    assert run["ai_filter_passed_count"] == 1
    assert run["ai_filter_rejected_count"] == 1
    assert run["ai_filter_skipped_count"] == 1
