from fastapi.testclient import TestClient


def test_get_and_update_user_settings(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/user-settings", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["default_mode"] == "full_time"

    updated = client.patch(
        "/user-settings",
        headers=auth_headers,
        json={
            "operator_name": "Guilherme",
            "operator_email": "me@example.com",
            "portfolio_url": "https://example.com/portfolio",
            "operator_linkedin_url": "https://www.linkedin.com/in/guilherme",
            "operator_whatsapp": "+55 (11) 99999-0000",
            "extra_context": "Use a concise tone and mention timezone overlap only when relevant.",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["operator_name"] == "Guilherme"
    assert updated.json()["portfolio_url"] == "https://example.com/portfolio"
    assert updated.json()["operator_linkedin_url"] == "https://www.linkedin.com/in/guilherme"
    assert updated.json()["operator_whatsapp"] == "+55 (11) 99999-0000"
    assert updated.json()["extra_context"] == "Use a concise tone and mention timezone overlap only when relevant."


def test_user_settings_rejects_malformed_sender_linkedin_url(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch(
        "/user-settings",
        headers=auth_headers,
        json={"operator_linkedin_url": "https://example.com/not-linkedin"},
    )

    assert response.status_code == 422


def test_user_settings_rejects_malformed_whatsapp(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch(
        "/user-settings",
        headers=auth_headers,
        json={"operator_whatsapp": "+55 11 call-me"},
    )

    assert response.status_code == 422
