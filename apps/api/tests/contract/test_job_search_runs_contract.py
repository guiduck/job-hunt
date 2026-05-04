from fastapi.testclient import TestClient


def test_start_job_search_run_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "pending"
    assert body["candidate_limit"] == 50
    assert body["requested_keywords"] == ["reactjs", "typescript", "nextjs", "nodejs"]


def test_list_job_search_runs_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    response = client.get("/job-search-runs", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
