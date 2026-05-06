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
        },
    )
    assert updated.status_code == 200
    assert updated.json()["operator_name"] == "Guilherme"
    assert updated.json()["portfolio_url"] == "https://example.com/portfolio"
