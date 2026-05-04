from app.jobs.linkedin_job_search import inspect_candidates


def test_worker_respects_50_candidate_cap(sample_linkedin_candidate: dict[str, object]) -> None:
    candidates = [sample_linkedin_candidate for _ in range(55)]
    inspected = inspect_candidates(candidates, ["typescript", "nextjs"], limit=50)
    assert len(inspected) == 50
    assert all(candidate["outcome"] == "accepted" for candidate in inspected)
