from fastapi.testclient import TestClient


def test_start_status_candidates_and_opportunities_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    assert created.status_code == 202
    run_id = created.json()["id"]

    status_response = client.get(f"/job-search-runs/{run_id}", headers=auth_headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "pending"

    candidates = client.get(f"/job-search-runs/{run_id}/candidates", headers=auth_headers)
    assert candidates.status_code == 200
    assert candidates.json() == []

    opportunities = client.get(f"/job-search-runs/{run_id}/opportunities", headers=auth_headers)
    assert opportunities.status_code == 200
    assert opportunities.json() == []
