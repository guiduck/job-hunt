from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_ai_filter_run_and_candidate_routes_are_owner_scoped(
    client: TestClient,
    db_session: Session,
    auth_headers: dict[str, str],
) -> None:
    created = client.post(
        "/job-search-runs",
        json={"keywords": ["typescript"], "ai_filters_enabled": True},
        headers=auth_headers,
    )
    run_id = created.json()["id"]
    other_user = create_user(db_session, email="other@example.com", password="Password123!", display_name="Other User")
    _, token = create_session(db_session, other_user)
    other_headers = {"Authorization": f"Bearer {token}"}

    assert client.get(f"/job-search-runs/{run_id}", headers=other_headers).status_code == 404
    assert client.get(f"/job-search-runs/{run_id}/candidates", headers=other_headers).status_code == 404
