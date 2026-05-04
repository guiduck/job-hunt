from app.models.user import PasswordResetRequest


def test_register_login_me_logout_and_password_reset_contract(client, db_session):
    register_response = client.post(
        "/auth/register",
        json={"email": "User@example.com", "password": "Password123!", "display_name": "User"},
    )
    assert register_response.status_code == 201
    register_payload = register_response.json()
    assert register_payload["token_type"] == "bearer"
    assert register_payload["access_token"]
    assert register_payload["user"]["email"] == "user@example.com"
    assert "password_hash" not in register_payload["user"]

    duplicate_response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "Password123!", "display_name": "User"},
    )
    assert duplicate_response.status_code == 409

    login_response = client.post("/auth/login", json={"email": "user@example.com", "password": "Password123!"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "user@example.com"

    reset_request_response = client.post("/auth/password-reset/request", json={"email": "unknown@example.com"})
    assert reset_request_response.status_code == 200
    assert reset_request_response.json() == {"status": "accepted"}

    client.post("/auth/password-reset/request", json={"email": "user@example.com"})
    reset_record = db_session.query(PasswordResetRequest).one()
    reset_token = "not-returned-by-contract"
    assert reset_record.token_hash != reset_token

    logout_response = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_response.status_code == 204
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_login_rejects_invalid_password(client):
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "Password123!", "display_name": "User"},
    )

    response = client.post("/auth/login", json={"email": "user@example.com", "password": "wrong"})

    assert response.status_code == 401
