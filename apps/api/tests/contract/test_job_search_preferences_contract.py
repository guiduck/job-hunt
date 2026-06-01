from fastapi.testclient import TestClient


def test_search_preferences_require_authentication(client: TestClient) -> None:
    response = client.get("/job-search-preferences")

    assert response.status_code == 401


def test_get_and_put_search_preferences_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    empty = client.get("/job-search-preferences", headers=auth_headers)
    assert empty.status_code == 200
    assert empty.json()["saved_keywords"] == []
    assert empty.json()["max_saved_keywords"] == 30

    updated = client.put(
        "/job-search-preferences",
        json={"search_text": "hiring react typescript remoto"},
        headers=auth_headers,
    )

    assert updated.status_code == 200
    body = updated.json()
    assert body["opportunity_type"] == "job"
    assert body["last_search_text"] == "hiring react typescript remoto"
    assert body["last_search_keywords"] == ["react", "typescript", "remoto"]
    assert body["saved_keywords"] == ["react", "typescript", "remoto"]


def test_delete_saved_keyword_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.put("/job-search-preferences", json={"search_text": "react typescript"}, headers=auth_headers)

    response = client.delete("/job-search-preferences/keywords/react", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["saved_keywords"] == ["typescript"]


def test_delete_unknown_saved_keyword_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.delete("/job-search-preferences/keywords/react", headers=auth_headers)

    assert response.status_code == 404
