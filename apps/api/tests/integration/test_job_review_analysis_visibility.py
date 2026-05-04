from fastapi.testclient import TestClient


def test_run_analysis_status_filter_is_visible(client: TestClient) -> None:
    created = client.post("/job-search-runs", json={"candidate_limit": 1}).json()

    response = client.get("/job-search-runs", params={"analysis_status": "deterministic_only"})

    assert response.status_code == 200
    assert any(run["id"] == created["id"] for run in response.json())
