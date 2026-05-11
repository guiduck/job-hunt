from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_sender_linkedin_url_is_owner_scoped(client: TestClient, db_session: Session, auth_headers: dict[str, str]) -> None:
    updated = client.patch(
        "/user-settings",
        headers=auth_headers,
        json={"operator_linkedin_url": "https://www.linkedin.com/in/owner-one"},
    )
    assert updated.status_code == 200

    other_user = create_user(
        db_session,
        email="other-settings@example.com",
        password="Password123!",
        display_name="Other Settings",
    )
    _, other_token = create_session(db_session, other_user)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    other_settings = client.get("/user-settings", headers=other_headers)

    assert other_settings.status_code == 200
    assert other_settings.json()["operator_linkedin_url"] is None
