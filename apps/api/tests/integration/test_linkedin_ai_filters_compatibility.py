from fastapi.testclient import TestClient


def test_existing_run_shape_renders_with_ai_filter_defaults(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/job-search-runs", json={"candidate_limit": 10}, headers=auth_headers)
    run_id = created.json()["id"]

    response = client.get(f"/job-search-runs/{run_id}", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["ai_filters_enabled"] is False
    assert body["ai_filter_status"] == "skipped"
    assert body["ai_filter_settings"] == {
        "remote_only": False,
        "exclude_onsite": False,
        "accepted_regions": [],
        "excluded_regions": [],
    }
