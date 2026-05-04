from fastapi.testclient import TestClient


def test_get_and_update_user_settings(client: TestClient) -> None:
    response = client.get("/user-settings")
    assert response.status_code == 200
    assert response.json()["default_mode"] == "full_time"

    updated = client.patch("/user-settings", json={"operator_name": "Guilherme", "operator_email": "me@example.com"})
    assert updated.status_code == 200
    assert updated.json()["operator_name"] == "Guilherme"
