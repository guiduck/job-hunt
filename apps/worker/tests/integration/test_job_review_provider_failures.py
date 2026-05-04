from app.jobs.linkedin_job_search import analyze_inspected_candidates


def test_provider_failure_candidates_use_skipped_analysis() -> None:
    candidates = analyze_inspected_candidates(
        [
            {
                "outcome": "failed_provider",
                "provider_status": "failed",
                "rejection_reason": "Provider unavailable",
                "matched_keywords": [],
            }
        ],
        ["typescript"],
    )

    assert candidates[0]["analysis_status"] == "skipped"
    assert candidates[0]["score_factors"] == {}
