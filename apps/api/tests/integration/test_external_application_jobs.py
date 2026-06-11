from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.email import EmailDraft, EmailTemplate, OutreachEvent, SendRequest, TemplateKind, TemplateMode


def create_email_job(client: TestClient, auth_headers: dict[str, str], email: str = "jobs@example.com") -> str:
    response = client.post(
        "/opportunities",
        headers=auth_headers,
        json={
            "opportunity_type": "job",
            "title": "Frontend Engineer",
            "organization_name": "Email Co",
            "source_name": "Ashby",
            "source_url": "https://jobs.ashbyhq.com/email-co/frontend",
            "source_query": "site:jobs.ashbyhq.com frontend",
            "source_evidence": f"Frontend role. Email {email}",
            "job_detail": {
                "company_name": "Email Co",
                "role_title": "Frontend Engineer",
                "job_description": "React and TypeScript",
                "contact_channel_type": "email",
                "contact_channel_value": email,
                "contact_email": email,
                "application_url": "https://jobs.ashbyhq.com/email-co/frontend",
                "matched_keywords": ["react", "typescript"],
            },
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_external_job(client: TestClient, auth_headers: dict[str, str]) -> str:
    apply_url = "https://jobs.lever.co/no-email/frontend"
    response = client.post(
        "/opportunities",
        headers=auth_headers,
        json={
            "opportunity_type": "job",
            "title": "Frontend Engineer",
            "organization_name": "External Co",
            "source_name": "Lever",
            "source_url": apply_url,
            "source_query": "site:jobs.lever.co frontend",
            "source_evidence": "Frontend role with apply URL.",
            "job_detail": {
                "company_name": "External Co",
                "role_title": "Frontend Engineer",
                "job_description": "React and TypeScript",
                "contact_channel_type": "other_public_contact",
                "contact_channel_value": apply_url,
                "application_url": apply_url,
                "matched_keywords": ["react", "typescript"],
            },
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_template(db_session: Session, user_id: str) -> EmailTemplate:
    template = EmailTemplate(
        user_id=user_id,
        mode=TemplateMode.FULL_TIME.value,
        template_kind=TemplateKind.JOB_APPLICATION.value,
        name="Default",
        subject_template="Application for {{ role_title }}",
        body_template="Hello {{ company_name }}",
    )
    db_session.add(template)
    db_session.commit()
    db_session.refresh(template)
    return template


def test_job_application_kind_filters(client: TestClient, auth_headers: dict[str, str]) -> None:
    email_id = create_email_job(client, auth_headers)
    external_id = create_external_job(client, auth_headers)

    with_email = client.get("/opportunities?opportunity_type=job&job_application_kind=email", headers=auth_headers)
    external = client.get("/opportunities?opportunity_type=job&job_application_kind=external_application", headers=auth_headers)

    assert with_email.status_code == 200
    assert external.status_code == 200
    assert [item["id"] for item in with_email.json()] == [email_id]
    assert [item["id"] for item in external.json()] == [external_id]
    assert external.json()[0]["job_detail"]["job_application_kind"] == "external_application"
    assert external.json()[0]["job_detail"]["application_url"] == "https://jobs.lever.co/no-email/frontend"


def test_career_page_email_job_remains_bulk_email_eligible(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    test_user,
) -> None:
    email_id = create_email_job(client, auth_headers, email="hello@example.com")
    template = create_template(db_session, test_user.id)

    response = client.post(
        "/bulk-email/preview",
        headers=auth_headers,
        json={"opportunity_ids": [email_id], "template_id": template.id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["sendable_count"] == 1
    assert body["items"][0]["recipient_email"] == "hello@example.com"
    assert body["items"][0]["outcome"] == "sendable"


def test_external_application_job_is_not_email_sendable(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    test_user,
) -> None:
    external_id = create_external_job(client, auth_headers)
    template = create_template(db_session, test_user.id)

    preview = client.post(
        "/bulk-email/preview",
        headers=auth_headers,
        json={"opportunity_ids": [external_id], "template_id": template.id},
    )
    draft = client.post(
        "/email-drafts",
        headers=auth_headers,
        json={"opportunity_id": external_id, "template_id": template.id},
    )

    assert preview.status_code == 200
    assert preview.json()["skipped_missing_contact_count"] == 1
    assert preview.json()["items"][0]["outcome"] == "skipped_missing_contact"
    assert draft.status_code == 422


def test_mark_applied_sets_stage_and_creates_no_gmail_events(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    external_id = create_external_job(client, auth_headers)

    response = client.patch(f"/opportunities/{external_id}/mark-applied", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["job_detail"]["job_stage"] == "applied"
    assert db_session.scalar(select(func.count()).select_from(SendRequest)) == 0
    assert db_session.scalar(select(func.count()).select_from(EmailDraft)) == 0
    assert db_session.scalar(select(func.count()).select_from(OutreachEvent)) == 0


def test_external_application_send_status_filters_use_applied_stage(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    external_id = create_external_job(client, auth_headers)

    unsent_before = client.get(
        "/opportunities?opportunity_type=job&job_application_kind=external_application&send_status=unsent",
        headers=auth_headers,
    )
    sent_before = client.get(
        "/opportunities?opportunity_type=job&job_application_kind=external_application&send_status=sent",
        headers=auth_headers,
    )

    assert unsent_before.status_code == 200
    assert sent_before.status_code == 200
    assert [item["id"] for item in unsent_before.json()] == [external_id]
    assert sent_before.json() == []

    client.patch(f"/opportunities/{external_id}/mark-applied", headers=auth_headers)

    unsent_after = client.get(
        "/opportunities?opportunity_type=job&job_application_kind=external_application&send_status=unsent",
        headers=auth_headers,
    )
    sent_after = client.get(
        "/opportunities?opportunity_type=job&job_application_kind=external_application&send_status=sent",
        headers=auth_headers,
    )

    assert unsent_after.status_code == 200
    assert sent_after.status_code == 200
    assert unsent_after.json() == []
    assert [item["id"] for item in sent_after.json()] == [external_id]
