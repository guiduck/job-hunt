from app.jobs.linkedin_job_search import aggregate_provider_status, final_run_status


def test_final_run_status_selection() -> None:
    assert final_run_status([{"outcome": "accepted", "provider_status": "collected"}], accepted_count=1) == "completed"
    assert final_run_status([{"outcome": "rejected_no_contact", "provider_status": "collected"}], accepted_count=0) == "completed_no_results"
    assert final_run_status([{"outcome": "failed_provider", "provider_status": "failed"}], accepted_count=0) == "failed"


def test_aggregate_provider_status_selection() -> None:
    assert aggregate_provider_status([{"provider_status": "collected"}]) == "collected"
    assert aggregate_provider_status([{"provider_status": "collected"}, {"provider_status": "blocked"}]) == "partial"
    assert aggregate_provider_status([{"provider_status": "blocked"}]) == "blocked"
    assert aggregate_provider_status([{"provider_status": "inaccessible"}]) == "inaccessible"
    assert aggregate_provider_status([{"provider_status": "empty"}]) == "empty"
    assert aggregate_provider_status([{"provider_status": "blocked"}, {"provider_status": "failed"}]) == "failed"
