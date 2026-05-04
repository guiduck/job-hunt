from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def _headers(db_session, email: str) -> dict[str, str]:
    user = create_user(db_session, email=email, password="Password123!", display_name=email.split("@")[0])
    _, token = create_session(db_session, user)
    return {"Authorization": f"Bearer {token}"}


def test_opportunities_are_isolated_between_users(client, db_session, review_ready_job_payload):
    user_a_headers = _headers(db_session, "a@example.com")
    user_b_headers = _headers(db_session, "b@example.com")

    create_response = client.post("/opportunities", json=review_ready_job_payload, headers=user_a_headers)
    assert create_response.status_code == 201
    opportunity_id = create_response.json()["id"]

    assert len(client.get("/opportunities", headers=user_a_headers).json()) == 1
    assert client.get("/opportunities", headers=user_b_headers).json() == []
    assert client.get(f"/opportunities/{opportunity_id}", headers=user_b_headers).status_code == 404
