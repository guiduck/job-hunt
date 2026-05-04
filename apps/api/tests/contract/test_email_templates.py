from fastapi.testclient import TestClient


def template_payload() -> dict[str, object]:
    return {
        "mode": "full_time",
        "template_kind": "job_application",
        "name": "Application",
        "subject_template": "Application for {{job_title}}",
        "body_template": "Hi {{company_name}}, see {{source_url}}",
        "is_active": True,
    }


def test_create_list_and_update_full_time_template(client: TestClient) -> None:
    created = client.post("/email-templates", json=template_payload())
    assert created.status_code == 201
    template = created.json()
    assert template["mode"] == "full_time"
    assert template["template_kind"] == "job_application"

    listed = client.get("/email-templates?mode=full_time&active_only=true")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [template["id"]]

    updated = client.patch(f"/email-templates/{template['id']}", json={"is_active": False})
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False

    active_only = client.get("/email-templates?mode=full_time&active_only=true")
    assert active_only.status_code == 200
    assert active_only.json() == []


def test_rejects_non_full_time_template_kind(client: TestClient) -> None:
    payload = template_payload() | {"template_kind": "freelance_first_contact"}
    response = client.post("/email-templates", json=payload)
    assert response.status_code == 422
