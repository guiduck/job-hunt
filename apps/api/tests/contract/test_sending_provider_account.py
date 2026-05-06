from fastapi.testclient import TestClient

from app.core.config import Settings
from app.services import google_oauth_service


def test_provider_status_does_not_expose_secret_paths_or_tokens(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/sending/provider-account", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["provider_name"] == "gmail"
    assert "token" not in data
    assert "client_secret" not in data


def test_google_oauth_start_reports_missing_client_secret(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/sending/google-oauth/start", headers=auth_headers)

    assert response.status_code == 409
    assert "GMAIL_OAUTH_CLIENT_CONFIG_JSON" in response.text


def test_google_oauth_url_uses_confidential_web_flow_without_pkce(monkeypatch) -> None:
    monkeypatch.setattr(
        google_oauth_service,
        "get_settings",
        lambda: Settings(
            gmail_oauth_client_config_json=(
                '{"web":{"client_id":"client-id","client_secret":"client-secret",'
                '"auth_uri":"https://accounts.google.com/o/oauth2/auth",'
                '"token_uri":"https://oauth2.googleapis.com/token",'
                '"redirect_uris":["http://localhost:8000/sending/google-oauth/callback"]}}'
            ),
            gmail_oauth_redirect_uri="http://localhost:8000/sending/google-oauth/callback",
        ),
    )

    auth_url = google_oauth_service.build_google_oauth_url()

    assert "code_challenge" not in auth_url
    assert "redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fsending%2Fgoogle-oauth%2Fcallback" in auth_url


def test_google_oauth_profile_fallback_uses_current_user_email(monkeypatch) -> None:
    def raise_forbidden(_credentials):
        raise RuntimeError("insufficient scopes")

    monkeypatch.setattr(google_oauth_service, "_get_gmail_profile", raise_forbidden)

    assert google_oauth_service._get_gmail_profile_or_fallback(object(), "user@example.com") == {
        "emailAddress": "user@example.com"
    }


def test_google_oauth_disconnect_clears_provider_state(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/sending/google-oauth/disconnect", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["auth_status"] == "authorization_required"
    assert response.json()["display_email"] is None
