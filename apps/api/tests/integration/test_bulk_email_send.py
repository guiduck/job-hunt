def test_bulk_preview_blocks_missing_invalid_and_duplicate(client, db_session, review_ready_job_payload: dict[str, object]) -> None:
    from app.models.email import SendRequest
    from app.services.email_send_service import record_send_success

    valid = client.post("/opportunities", json=review_ready_job_payload).json()
    invalid_payload = review_ready_job_payload | {
        "source_url": "https://www.linkedin.com/feed/update/invalid-email",
        "job_detail": review_ready_job_payload["job_detail"] | {
            "contact_channel_value": "not-an-email",
            "contact_email": "not-an-email",
        },
    }
    invalid = client.post("/opportunities", json=invalid_payload).json()
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
    draft = client.post("/email-drafts", json={"opportunity_id": valid["id"], "template_id": template["id"]}).json()
    sent = client.post(f"/email-drafts/{draft['id']}/approve-send").json()
    record_send_success(db_session, db_session.get(SendRequest, sent["id"]), "gmail-message-1")

    preview = client.post(
        "/bulk-email/preview",
        json={"opportunity_ids": [valid["id"], invalid["id"]], "template_id": template["id"]},
    ).json()

    assert preview["skipped_duplicate_count"] == 1
    assert preview["blocked_invalid_contact_count"] == 1
