from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_field_assistant_data_is_owner_scoped(client: TestClient, db_session: Session, auth_headers: dict[str, str]) -> None:
    activation = client.post(
        "/field-assistant/activations",
        headers=auth_headers,
        json={"scope_type": "base_domain", "scope_value": "https://jobs.example.com"},
    )
    assert activation.status_code == 201
    suggestion = client.post(
        "/field-assistant/suggestions",
        headers=auth_headers,
        json={"keyword": "motivation", "response_text": "Owner answer", "source": "manual"},
    )
    assert suggestion.status_code == 201

    other_user = create_user(db_session, email="field-other@example.com", password="Password123!", display_name="Other")
    _, other_token = create_session(db_session, other_user)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    other_activations = client.get("/field-assistant/activations", headers=other_headers)
    other_suggestions = client.get("/field-assistant/suggestions?keyword=motivation", headers=other_headers)
    other_delete = client.delete(f"/field-assistant/activations/{activation.json()['id']}", headers=other_headers)
    other_used = client.post(f"/field-assistant/suggestions/{suggestion.json()['id']}/used", headers=other_headers)

    assert other_activations.status_code == 200
    assert other_activations.json()["items"] == []
    assert other_suggestions.status_code == 200
    assert other_suggestions.json()["items"] == []
    assert other_delete.status_code == 404
    assert other_used.status_code == 404
