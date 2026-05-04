from fastapi.testclient import TestClient


def test_provider_status_does_not_expose_secret_paths_or_tokens(client: TestClient) -> None:
    response = client.get("/sending/provider-account")
    assert response.status_code == 200
    data = response.json()
    assert data["provider_name"] == "gmail"
    assert "token" not in data
    assert "client_secret" not in data


def test_google_oauth_start_reports_missing_client_secret(client: TestClient) -> None:
    response = client.get("/sending/google-oauth/start")

    assert response.status_code == 409
    assert "GMAIL_OAUTH_CLIENT_CONFIG_JSON" in response.text


def test_google_oauth_disconnect_clears_provider_state(client: TestClient) -> None:
    response = client.post("/sending/google-oauth/disconnect")

    assert response.status_code == 200
    assert response.json()["auth_status"] == "authorization_required"
    assert response.json()["display_email"] is None
