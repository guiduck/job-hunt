from fastapi.testclient import TestClient


def test_run_contract_includes_analysis_summary(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/job-search-runs", json={"candidate_limit": 1}, headers=auth_headers)

    assert response.status_code == 202
    body = response.json()
    assert body["analysis_status"] == "deterministic_only"
    assert body["deterministic_only_count"] == 0
    assert body["analysis_fallback_count"] == 0
