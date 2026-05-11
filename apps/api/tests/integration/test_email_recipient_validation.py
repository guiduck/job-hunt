from fastapi.testclient import TestClient


def test_manual_draft_recipient_edit_is_sanitized(
    client: TestClient,
    auth_headers: dict[str, str],
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    template = client.post(
        "/email-templates",
        headers=auth_headers,
        json={
            "mode": "full_time",
            "template_kind": "job_application",
            "name": "Application",
            "subject_template": "Application",
            "body_template": "Hello",
        },
    ).json()
    draft = client.post(
        "/email-drafts",
        headers=auth_headers,
        json={"opportunity_id": opportunity["id"], "template_id": template["id"]},
    ).json()

    updated = client.patch(
        f"/email-drafts/{draft['id']}",
        headers=auth_headers,
        json={"to_email": "edited@example.comhashtag"},
    )

    assert updated.status_code == 200
    assert updated.json()["to_email"] == "edited@example.com"
