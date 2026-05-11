from fastapi.testclient import TestClient


def test_activation_crud_and_exact_page_normalization(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/field-assistant/activations",
        headers=auth_headers,
        json={"scope_type": "exact_page", "scope_value": "https://jobs.example.com/apply?job=1&utm_source=x#top"},
    )
    assert created.status_code == 201
    activation = created.json()
    assert activation["scope_value"] == "https://jobs.example.com/apply?job=1"

    updated = client.patch(
        f"/field-assistant/activations/{activation['id']}",
        headers=auth_headers,
        json={"enabled": False, "display_name": "One application"},
    )
    assert updated.status_code == 200
    assert updated.json()["enabled"] is False
    assert updated.json()["display_name"] == "One application"

    deleted = client.delete(f"/field-assistant/activations/{activation['id']}", headers=auth_headers)
    assert deleted.status_code == 204

    listed = client.get("/field-assistant/activations", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["items"] == []


def test_activation_create_reenables_existing_scope(client: TestClient, auth_headers: dict[str, str]) -> None:
    payload = {"scope_type": "base_domain", "scope_value": "https://www.ashbyhq.com/jobs"}
    first = client.post("/field-assistant/activations", headers=auth_headers, json=payload)
    assert first.status_code == 201
    activation_id = first.json()["id"]
    client.patch(f"/field-assistant/activations/{activation_id}", headers=auth_headers, json={"enabled": False})

    second = client.post("/field-assistant/activations", headers=auth_headers, json=payload)

    assert second.status_code == 201
    assert second.json()["id"] == activation_id
    assert second.json()["enabled"] is True
