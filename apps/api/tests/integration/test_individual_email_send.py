from app.models.email import SendRequest
from app.services.email_send_service import record_send_success


def test_individual_send_success_marks_job_applied_and_blocks_duplicate(
    client,
    db_session,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", json=review_ready_job_payload).json()
    template = client.post(
        "/email-templates",
        json={
            "mode": "full_time",
            "template_kind": "job_application",
            "name": "Application",
            "subject_template": "Application",
            "body_template": "Hi",
        },
    ).json()
    draft = client.post("/email-drafts", json={"opportunity_id": opportunity["id"], "template_id": template["id"]}).json()
    send_request_payload = client.post(f"/email-drafts/{draft['id']}/approve-send").json()
    send_request = db_session.get(SendRequest, send_request_payload["id"])
    record_send_success(db_session, send_request, "gmail-message-1")

    detail = client.get(f"/opportunities/{opportunity['id']}").json()
    assert detail["job_detail"]["job_stage"] == "applied"

    duplicate_draft = client.post("/email-drafts", json={"opportunity_id": opportunity["id"], "template_id": template["id"]}).json()
    duplicate = client.post(f"/email-drafts/{duplicate_draft['id']}/approve-send")
    assert duplicate.status_code == 409
