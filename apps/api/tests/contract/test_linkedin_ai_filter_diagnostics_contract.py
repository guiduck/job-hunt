from fastapi.testclient import TestClient


def test_run_contract_exposes_ai_filter_counters(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/job-search-runs", json={"keywords": ["typescript"]}, headers=auth_headers)
    run_id = created.json()["id"]

    response = client.get(f"/job-search-runs/{run_id}", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["ai_filter_inspected_count"] == 0
    assert body["ai_filter_rejected_count"] == 0
    assert body["ai_filter_fallback_count"] == 0


def test_candidates_contract_accepts_ai_filter_status_query(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/job-search-runs", json={"keywords": ["typescript"]}, headers=auth_headers)
    run_id = created.json()["id"]

    response = client.get(f"/job-search-runs/{run_id}/candidates?ai_filter_status=rejected", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []
