from fastapi.testclient import TestClient

from app.services import bulk_email_service


def test_ai_generation_progress_route_exposes_item_statuses(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    monkeypatch.setattr(
        bulk_email_service,
        "generate_job_application_email",
        lambda _context: {"subject": "Application", "body": "Hello"},
    )

    created = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})
    progress = client.get(f"/bulk-email/generate-ai/{created.json()['id']}", headers=auth_headers)

    assert progress.status_code == 200
    body = progress.json()
    assert body["status"] == "completed"
    assert body["items"][0]["status"] == "completed"
    assert body["items"][0]["subject"] == "Application"


def test_ai_generation_progress_marks_failed_items(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    monkeypatch.setattr(
        bulk_email_service,
        "generate_job_application_email",
        lambda _context: (_ for _ in ()).throw(
            bulk_email_service.AIEmailGenerationError("Temporary model error", code="temporary_model_error", retryable=True)
        ),
    )

    created = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert created.status_code == 201
    item = created.json()["items"][0]
    assert item["status"] == "failed"
    assert item["ai_error_code"] == "temporary_model_error"
    assert item["retryable"] is True
