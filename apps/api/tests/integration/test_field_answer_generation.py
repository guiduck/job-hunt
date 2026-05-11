from fastapi.testclient import TestClient

from app.services import field_assistant_service


def test_generate_field_answer_uses_sanitized_context(monkeypatch, client: TestClient, auth_headers: dict[str, str]) -> None:
    captured: dict[str, object] = {}

    def fake_generate(context: dict[str, object]) -> dict[str, object]:
        captured.update(context)
        return {"answer_text": "I am interested because my experience matches the role.", "rationale": "Matched context", "missing_context": []}

    monkeypatch.setattr(field_assistant_service, "generate_field_answer", fake_generate)

    response = client.post(
        "/field-assistant/generate",
        headers=auth_headers,
        json={
            "keyword": "motivation",
            "field_context": {
                "label_text": "Why do you want to work here?",
                "placeholder": "Tell us about your motivation",
                "field_type": "textarea",
                "existing_value": "",
                "confidence": 0.92,
            },
            "page_context": {"origin": "https://jobs.example.com", "sanitized_url": "https://jobs.example.com/apply"},
        },
    )

    assert response.status_code == 200
    assert response.json()["answer_text"].startswith("I am interested")
    assert captured["keyword"] == "motivation"
    assert "field" in captured
    assert "page" in captured


def test_generate_field_answer_rejects_unsafe_context(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/field-assistant/generate",
        headers=auth_headers,
        json={
            "keyword": "otp",
            "field_context": {"label_text": "One time password", "field_type": "textarea", "confidence": 1},
            "page_context": {"origin": "https://jobs.example.com"},
        },
    )

    assert response.status_code == 400
