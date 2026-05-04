from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import text

from app.services.email_delivery import process_pending_send_requests
from app.services.gmail_provider import GmailSendResult


class FakeProvider:
    def send(self, payload):
        assert payload.to_email == "jobs@example.com"
        return GmailSendResult(True, provider_message_id="gmail-message-1")


def test_process_pending_send_request_records_success_and_marks_applied(db_session) -> None:
    now = datetime.now(UTC)
    opportunity_id = str(uuid4())
    template_id = str(uuid4())
    request_id = str(uuid4())
    db_session.execute(
        text(
            """
            INSERT INTO opportunities (
              id, opportunity_type, title, organization_name, source_name, source_url,
              source_query, source_evidence, captured_at, created_at, updated_at
            )
            VALUES (:id, 'job', 'Engineer', 'Example Co', 'LinkedIn', 'https://example.com',
                    'hiring', 'Email jobs@example.com', :now, :now, :now)
            """
        ),
        {"id": opportunity_id, "now": now},
    )
    db_session.execute(
        text(
            """
            INSERT INTO job_opportunity_details (
              id, opportunity_id, contact_channel_value, matched_keywords, job_stage,
              created_at, updated_at
            )
            VALUES (:id, :opportunity_id, 'jobs@example.com', '[]', 'new', :now, :now)
            """
        ),
        {"id": str(uuid4()), "opportunity_id": opportunity_id, "now": now},
    )
    db_session.execute(
        text(
            """
            INSERT INTO email_templates (
              id, mode, template_kind, name, subject_template, body_template,
              variables_schema, is_active, created_at, updated_at
            )
            VALUES (:id, 'full_time', 'job_application', 'Application', 'Subject', 'Body', '{}', 1, :now, :now)
            """
        ),
        {"id": template_id, "now": now},
    )
    db_session.execute(
        text(
            """
            INSERT INTO send_requests (
              id, opportunity_id, template_id, template_kind, recipient_email, subject_snapshot,
              body_snapshot, resume_snapshot, status, approved_at, created_at, updated_at
            )
            VALUES (:id, :opportunity_id, :template_id, 'job_application', 'jobs@example.com',
                    'Subject', 'Body', '{}', 'approved', :now, :now, :now)
            """
        ),
        {"id": request_id, "opportunity_id": opportunity_id, "template_id": template_id, "now": now},
    )

    assert process_pending_send_requests(db_session, provider=FakeProvider()) == 1

    send_status = db_session.execute(text("SELECT status, provider_message_id FROM send_requests WHERE id = :id"), {"id": request_id}).one()
    assert send_status.status == "sent"
    assert send_status.provider_message_id == "gmail-message-1"
    job_stage = db_session.execute(
        text("SELECT job_stage FROM job_opportunity_details WHERE opportunity_id = :id"),
        {"id": opportunity_id},
    ).scalar_one()
    assert job_stage == "applied"
    assert db_session.execute(text("SELECT COUNT(*) FROM outreach_events")).scalar_one() == 1
