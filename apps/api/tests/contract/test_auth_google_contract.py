from fastapi.testclient import TestClient

from app.services import google_primary_auth_service


def test_google_primary_auth_start_contract(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(google_primary_auth_service, "_google_primary_client_id", lambda settings: "client-id")

    response = client.get("/auth/google/start")

    assert response.status_code == 200
    body = response.json()
    assert body["auth_url"].startswith("https://accounts.google.com/")
    assert body["provider"] == "google"


def test_google_primary_auth_start_accepts_extension_redirect(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(google_primary_auth_service, "_google_primary_client_id", lambda settings: "client-id")

    response = client.get("/auth/google/start?success_redirect_url=https%3A%2F%2Fabc.chromiumapp.org%2Fgoogle-auth")

    assert response.status_code == 200
    body = response.json()
    assert "state=" in body["auth_url"]


def test_google_primary_auth_start_reports_missing_client_config(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(google_primary_auth_service, "_google_primary_client_id", lambda settings: None)

    response = client.get("/auth/google/start")

    assert response.status_code == 409
    assert "Configure GOOGLE_AUTH_CLIENT_ID" in response.text


def test_google_primary_auth_callback_returns_app_session(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-contract",
            "email": "contract@example.com",
            "email_verified": True,
            "name": "Contract User",
        },
    )

    response = client.get("/auth/google/callback?code=fake-code")

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "contract@example.com"


def test_google_primary_auth_callback_redirects_to_extension(monkeypatch, client: TestClient) -> None:
    monkeypatch.setattr(
        google_primary_auth_service,
        "exchange_code_for_google_profile",
        lambda code: {
            "sub": "google-subject-extension",
            "email": "extension@example.com",
            "email_verified": True,
            "name": "Extension User",
        },
    )
    state = google_primary_auth_service.encode_google_auth_state("https://abc.chromiumapp.org/google-auth")

    response = client.get(f"/auth/google/callback?code=fake-code&state={state}", follow_redirects=False)

    assert response.status_code in {302, 307}
    location = response.headers["location"]
    assert location.startswith("https://abc.chromiumapp.org/google-auth#")
    assert "access_token=" in location


def test_google_primary_auth_callback_redirects_provider_error_to_extension(client: TestClient) -> None:
    state = google_primary_auth_service.encode_google_auth_state("https://abc.chromiumapp.org/google-auth")

    response = client.get(f"/auth/google/callback?error=access_denied&state={state}", follow_redirects=False)

    assert response.status_code in {302, 307}
    location = response.headers["location"]
    assert location.startswith("https://abc.chromiumapp.org/google-auth#")
    assert "error=" in location


def test_google_primary_auth_userinfo_fallback_parses_verified_email(monkeypatch) -> None:
    class Response:
        status_code = 200

        @staticmethod
        def json() -> dict[str, object]:
            return {
                "sub": "google-subject-userinfo",
                "email": "userinfo@example.com",
                "email_verified": "true",
                "name": "User Info",
            }

    monkeypatch.setattr("requests.get", lambda *args, **kwargs: Response())

    profile = google_primary_auth_service._google_profile_from_userinfo("access-token")

    assert profile["sub"] == "google-subject-userinfo"
    assert profile["email"] == "userinfo@example.com"
    assert profile["email_verified"] is True
