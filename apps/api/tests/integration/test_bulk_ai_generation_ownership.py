from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services import bulk_email_service
from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_ai_generation_progress_is_owner_scoped(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
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

    other_user = create_user(
        db_session,
        email="other-ai-owner@example.com",
        password="Password123!",
        display_name="Other AI Owner",
    )
    _, other_token = create_session(db_session, other_user)

    response = client.get(
        f"/bulk-email/generate-ai/{created.json()['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404
