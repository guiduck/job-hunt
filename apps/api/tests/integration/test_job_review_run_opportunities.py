from fastapi.testclient import TestClient


def test_run_candidates_accept_review_filters(client: TestClient) -> None:
    run = client.post("/job-search-runs", json={"candidate_limit": 1}).json()

    response = client.get(
        f"/job-search-runs/{run['id']}/candidates",
        params={"min_score": 1, "analysis_status": "deterministic_only"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
