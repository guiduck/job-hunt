from fastapi.testclient import TestClient


def test_suggestions_save_only_explicitly_and_list_by_keyword(client: TestClient, auth_headers: dict[str, str]) -> None:
    empty = client.get("/field-assistant/suggestions?keyword=motivation", headers=auth_headers)
    assert empty.status_code == 200
    assert empty.json()["items"] == []

    saved = client.post(
        "/field-assistant/suggestions",
        headers=auth_headers,
        json={"keyword": "Motivation", "response_text": "Saved answer", "source": "edited"},
    )

    assert saved.status_code == 201
    listed = client.get("/field-assistant/suggestions?keyword=motivation", headers=auth_headers)
    assert [item["response_text"] for item in listed.json()["items"]] == ["Saved answer"]


def test_suggestions_keep_only_three_per_owner_keyword(client: TestClient, auth_headers: dict[str, str]) -> None:
    for index in range(4):
        response = client.post(
            "/field-assistant/suggestions",
            headers=auth_headers,
            json={"keyword": "availability", "response_text": f"Answer {index}", "source": "manual"},
        )
        assert response.status_code == 201

    listed = client.get("/field-assistant/suggestions?keyword=availability", headers=auth_headers)
    items = listed.json()["items"]

    assert len(items) == 3
    assert "Answer 0" not in {item["response_text"] for item in items}


def test_suggestion_used_updates_usage_metadata(client: TestClient, auth_headers: dict[str, str]) -> None:
    saved = client.post(
        "/field-assistant/suggestions",
        headers=auth_headers,
        json={"keyword": "experience", "response_text": "I have relevant experience.", "source": "manual"},
    )
    suggestion_id = saved.json()["id"]

    used = client.post(f"/field-assistant/suggestions/{suggestion_id}/used", headers=auth_headers)

    assert used.status_code == 200
    assert used.json()["used_count"] == 1
    assert used.json()["last_used_at"] is not None
