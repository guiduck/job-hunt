from app.jobs.linkedin_job_search import inspect_candidates


def test_failed_provider_candidate_stays_rejected() -> None:
    [candidate] = inspect_candidates(
        [
            {
                "provider_status": "blocked",
                "source_query": "hiring reactjs",
                "rejection_reason": "blocked",
            }
        ],
        ["reactjs"],
        limit=50,
    )

    assert candidate["outcome"] == "blocked_source"
    assert candidate["rejection_reason"] == "blocked"
