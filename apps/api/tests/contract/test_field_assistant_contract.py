from fastapi.testclient import TestClient


def test_field_assistant_activation_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/field-assistant/activations",
        headers=auth_headers,
        json={"scope_type": "base_domain", "scope_value": "https://jobs.example.com/apply", "display_name": "Example Jobs"},
    )

    assert created.status_code == 201
    body = created.json()
    assert body["scope_type"] == "base_domain"
    assert body["scope_value"] == "jobs.example.com"
    assert body["enabled"] is True

    listed = client.get("/field-assistant/activations", headers=auth_headers)

    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == body["id"]


def test_field_assistant_suggestions_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/field-assistant/suggestions",
        headers=auth_headers,
        json={"keyword": "Motivation", "response_text": "I am excited by the product and role.", "source": "manual"},
    )

    assert created.status_code == 201
    body = created.json()
    assert body["keyword"] == "motivation"
    assert body["response_text"] == "I am excited by the product and role."
    assert body["used_count"] == 0

    listed = client.get("/field-assistant/suggestions?keyword=motivation", headers=auth_headers)

    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1


def test_field_answer_generation_rejects_unsafe_context_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/field-assistant/generate",
        headers=auth_headers,
        json={
            "keyword": "password",
            "field_context": {"label_text": "Password", "field_type": "textarea", "confidence": 0.9},
            "page_context": {"origin": "https://jobs.example.com"},
        },
    )

    assert response.status_code == 400


def test_field_answer_generation_uses_selected_resume_context(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
) -> None:
    resume = client.post(
        "/user-settings/resumes",
        headers=auth_headers,
        json={
            "display_name": "AI Systems CV",
            "file_name": "cv.pdf",
            "file_path": ".local/resumes/cv.pdf",
            "mime_type": "application/pdf",
        },
    ).json()
    client.patch(
        f"/user-settings/resumes/{resume['id']}",
        headers=auth_headers,
        json={"include_in_field_assistant_context": True},
    )
    captured: dict[str, object] = {}

    def fake_generate_field_answer(context: dict[str, object]) -> dict[str, object]:
        captured.update(context)
        return {"answer_text": "I have applied AI prompt engineering in production projects.", "missing_context": []}

    monkeypatch.setattr("app.services.field_assistant_service.generate_field_answer", fake_generate_field_answer)

    response = client.post(
        "/field-assistant/generate",
        headers=auth_headers,
        json={
            "keyword": "prompting_ai",
            "field_context": {
                "label_text": "Describe your AI prompting experience",
                "field_type": "textarea",
                "confidence": 0.9,
            },
            "page_context": {"origin": "https://jobs.example.com", "page_title": "Application form"},
        },
    )

    assert response.status_code == 200
    assert captured["resumes"][0]["display_name"] == "AI Systems CV"
    assert captured["resumes"][0]["selected_for_field_assistant"] is True
