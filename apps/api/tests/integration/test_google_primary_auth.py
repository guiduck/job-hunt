from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import GoogleIdentityLink
from app.services import google_primary_auth_service
from app.services.auth_service import create_user


def test_google_primary_auth_creates_user_and_session(monkeypatch, client: TestClient, db_session: Session) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-new",
            "email": "new-google@example.com",
            "email_verified": True,
            "name": "New Google",
        },
    )

    response = client.get("/auth/google/callback?code=fake-code")

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "new-google@example.com"
    link = db_session.query(GoogleIdentityLink).one()
    assert link.user_id == body["user"]["id"]
    assert link.provider_subject == "google-subject-new"


def test_google_primary_auth_links_existing_verified_email(
    monkeypatch,
    client: TestClient,
    db_session: Session,
) -> None:
    existing = create_user(
        db_session,
        email="existing@example.com",
        password="Password123!",
        display_name="Existing Local",
    )
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-existing",
            "email": "existing@example.com",
            "email_verified": True,
            "name": "Existing Google",
        },
    )

    response = client.get("/auth/google/callback?code=fake-code")

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == existing.id
    assert db_session.query(GoogleIdentityLink).one().user_id == existing.id


def test_google_primary_auth_rejects_unverified_email(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-unverified",
            "email": "unverified@example.com",
            "email_verified": False,
            "name": "Unverified",
        },
    )

    response = client.get("/auth/google/callback?code=fake-code")

    assert response.status_code == 400
    assert "verified" in response.text.lower()
