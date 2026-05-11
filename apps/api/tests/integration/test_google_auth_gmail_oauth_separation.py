from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.email import SendingProviderAccount
from app.services import google_primary_auth_service


def test_google_primary_auth_does_not_create_gmail_sending_connection(
    monkeypatch,
    client: TestClient,
    db_session: Session,
) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-no-gmail",
            "email": "primary-only@example.com",
            "email_verified": True,
            "name": "Primary Only",
        },
    )

    response = client.get("/auth/google/callback?code=fake-code")

    assert response.status_code == 200
    assert db_session.query(SendingProviderAccount).count() == 0


def test_google_primary_auth_session_still_shows_gmail_disconnected(
    monkeypatch,
    client: TestClient,
) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-disconnected",
            "email": "disconnected@example.com",
            "email_verified": True,
            "name": "Disconnected",
        },
    )

    callback = client.get("/auth/google/callback?code=fake-code")
    token = callback.json()["access_token"]

    provider = client.get("/sending/provider-account", headers={"Authorization": f"Bearer {token}"})

    assert provider.status_code == 200
    assert provider.json()["provider_name"] == "gmail"
    assert provider.json()["auth_status"] in {"not_configured", "authorization_required"}
    assert provider.json()["display_email"] is None
