from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_search_preferences_are_owner_scoped(
    client: TestClient,
    db_session: Session,
    auth_headers: dict[str, str],
) -> None:
    second_user = create_user(
        db_session,
        email="other@example.com",
        password="Password123!",
        display_name="Other User",
    )
    _, second_token = create_session(db_session, second_user)
    second_headers = {"Authorization": f"Bearer {second_token}"}

    client.put("/job-search-preferences", json={"search_text": "react typescript"}, headers=auth_headers)
    client.put("/job-search-preferences", json={"search_text": "python data"}, headers=second_headers)

    first = client.get("/job-search-preferences", headers=auth_headers)
    second = client.get("/job-search-preferences", headers=second_headers)

    assert first.json()["saved_keywords"] == ["react", "typescript"]
    assert second.json()["saved_keywords"] == ["python", "data"]


def test_badge_deletion_is_owner_scoped(
    client: TestClient,
    db_session: Session,
    auth_headers: dict[str, str],
) -> None:
    second_user = create_user(
        db_session,
        email="delete-other@example.com",
        password="Password123!",
        display_name="Delete Other",
    )
    _, second_token = create_session(db_session, second_user)
    second_headers = {"Authorization": f"Bearer {second_token}"}
    client.put("/job-search-preferences", json={"search_text": "react"}, headers=auth_headers)
    client.put("/job-search-preferences", json={"search_text": "react"}, headers=second_headers)

    deleted = client.delete("/job-search-preferences/keywords/react", headers=second_headers)
    first = client.get("/job-search-preferences", headers=auth_headers)

    assert deleted.status_code == 200
    assert deleted.json()["saved_keywords"] == []
    assert first.json()["saved_keywords"] == ["react"]
