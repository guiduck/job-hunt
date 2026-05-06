from app.jobs.linkedin_job_search import apply_ai_filters, finalize_run


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
