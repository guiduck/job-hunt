from fastapi.testclient import TestClient


from app.services import google_primary_auth_service


def test_google_primary_auth_start_contract(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(google_primary_auth_service, "_google_primary_client_id", lambda settings: "client-id")

    response = client.get("/auth/google/start")

    assert response.status_code == 200
    body = response.json()
    assert body["auth_url"].startswith("https://")


def test_user_settings_contract_includes_sender_linkedin_url(client: TestClient, auth_headers: dict[str, str]) -> None:
    updated = client.patch(
        "/user-settings",
        headers=auth_headers,
        json={"operator_linkedin_url": "https://www.linkedin.com/in/example-profile"},
    )

    assert updated.status_code == 200
    assert updated.json()["operator_linkedin_url"] == "https://www.linkedin.com/in/example-profile"

    fetched = client.get("/user-settings", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["operator_linkedin_url"] == "https://www.linkedin.com/in/example-profile"


def test_opportunities_contract_returns_paginated_envelope(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/opportunities?opportunity_type=job&page=1&page_size=50", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert set(["items", "page", "page_size", "total_items", "total_pages", "has_next", "has_previous"]).issubset(body)
    assert body["page"] == 1
    assert body["page_size"] == 50
    assert isinstance(body["items"], list)


def test_bulk_ai_generation_contract_returns_item_progress(
    client: TestClient,
    auth_headers: dict[str, str],
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()

    created = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert created.status_code == 201
    body = created.json()
    assert body["status"] in {"queued", "running", "completed", "completed_with_failures", "failed", "cancelled"}
    assert body["selected_count"] == 1
    assert body["items"][0]["opportunity_id"] == opportunity["id"]
    assert body["items"][0]["status"] in {"queued", "running", "completed", "failed", "skipped"}

    progress = client.get(f"/bulk-email/generate-ai/{body['id']}", headers=auth_headers)
    assert progress.status_code == 200
    assert progress.json()["id"] == body["id"]
