from fastapi.testclient import TestClient


def test_last_search_persists_and_capture_merges_without_deleting_badges(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    first = client.put("/job-search-preferences", json={"search_text": "react typescript remoto"}, headers=auth_headers)
    assert first.status_code == 200

    second = client.put("/job-search-preferences", json={"search_text": "react node"}, headers=auth_headers)

    assert second.status_code == 200
    body = second.json()
    assert body["last_search_text"] == "react node"
    assert body["last_search_keywords"] == ["react", "node"]
    assert body["saved_keywords"] == ["react", "typescript", "remoto", "node"]


def test_job_search_run_records_current_input_after_preference_save(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    client.put("/job-search-preferences", json={"search_text": "react typescript remoto"}, headers=auth_headers)

    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["react", "typescript"],
            "search_query": "react typescript",
            "candidate_limit": 1,
        },
        headers=auth_headers,
    )

    assert response.status_code == 202
    body = response.json()
    assert body["requested_keywords"] == ["react", "typescript"]
    assert body["search_query"] == "react typescript"


def test_delete_badge_does_not_change_current_input_or_historical_run(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    client.put("/job-search-preferences", json={"search_text": "react typescript remoto"}, headers=auth_headers)
    created = client.post(
        "/job-search-runs",
        json={"keywords": ["react", "typescript"], "search_query": "react typescript", "candidate_limit": 1},
        headers=auth_headers,
    )
    run_id = created.json()["id"]

    deleted = client.delete("/job-search-preferences/keywords/remoto", headers=auth_headers)
    run = client.get(f"/job-search-runs/{run_id}", headers=auth_headers)

    assert deleted.status_code == 200
    assert deleted.json()["last_search_text"] == "react typescript remoto"
    assert deleted.json()["saved_keywords"] == ["react", "typescript"]
    assert run.json()["requested_keywords"] == ["react", "typescript"]
    assert run.json()["search_query"] == "react typescript"


def test_saved_keyword_cap_is_applied_during_preference_update(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    search_text = " ".join(f"term{index}" for index in range(35))

    response = client.put("/job-search-preferences", json={"search_text": search_text}, headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()["saved_keywords"]) == 30
    assert response.json()["saved_keywords"][-1] == "term29"
