from fastapi.testclient import TestClient


def _template(client: TestClient) -> dict[str, object]:
    return client.post(
        "/email-templates",
        json={
            "mode": "full_time",
            "template_kind": "job_application",
            "name": "Application",
            "subject_template": "Application for {{job_title}}",
            "body_template": "Hi {{company_name}}",
        },
    ).json()


def test_create_update_and_approve_email_draft(
    client: TestClient,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", json=review_ready_job_payload).json()
    template = _template(client)

    created = client.post("/email-drafts", json={"opportunity_id": opportunity["id"], "template_id": template["id"]})
    assert created.status_code == 201
    draft = created.json()
    assert draft["to_email"] == "jobs@example.com"

    updated = client.patch(f"/email-drafts/{draft['id']}", json={"subject": "Edited subject"})
    assert updated.status_code == 200
    assert updated.json()["subject"] == "Edited subject"

    approved = client.post(f"/email-drafts/{draft['id']}/approve-send")
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
