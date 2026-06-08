from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session
from tests.integration.test_external_application_jobs import create_external_job


def test_mark_applied_is_owner_scoped(client: TestClient, auth_headers: dict[str, str], db_session: Session) -> None:
    external_id = create_external_job(client, auth_headers)
    other_user = create_user(db_session, email="other@example.com", password="Password123!", display_name="Other")
    _, other_token = create_session(db_session, other_user)

    response = client.patch(
        f"/opportunities/{external_id}/mark-applied",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404
