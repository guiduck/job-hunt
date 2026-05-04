from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.gmail_provider import GmailAttachment, GmailProvider, GmailSendInput


def process_pending_send_requests(db: Session, provider: GmailProvider | None = None, limit: int = 5) -> int:
    rows = (
        db.execute(
            text(
                """
                SELECT id, user_id, opportunity_id, template_id, template_kind, resume_attachment_id,
                       recipient_email, subject_snapshot, body_snapshot, draft_id, bulk_batch_id
                FROM send_requests
                WHERE status IN ('approved', 'queued')
                ORDER BY created_at ASC
                LIMIT :limit
                """
            ),
            {"limit": limit},
        )
        .mappings()
        .all()
    )

    processed = 0
    for row in rows:
        row_provider = provider or GmailProvider(token_info=_load_gmail_token_info(db, row["user_id"]))
        db.execute(
            text("UPDATE send_requests SET status = 'sending', queued_at = COALESCE(queued_at, :now), updated_at = :now WHERE id = :id"),
            {"id": row["id"], "now": datetime.now(UTC)},
        )
        attachment = _load_attachment(db, row["resume_attachment_id"], row["user_id"])
        if row["resume_attachment_id"] and attachment is None:
            _record_failure(db, row, "resume_unavailable", "Selected resume is no longer available.")
            processed += 1
            continue

        result = row_provider.send(
            GmailSendInput(
                to_email=row["recipient_email"],
                subject=row["subject_snapshot"],
                body=row["body_snapshot"],
                attachments=[attachment] if attachment else [],
            )
        )
        if result.success:
            _record_success(db, row, result.provider_message_id)
        else:
            _record_failure(db, row, result.error_code or "gmail_send_failed", result.error_message or "Gmail send failed.")
        processed += 1
    db.commit()
    return processed


def _load_attachment(db: Session, resume_attachment_id: str | None, user_id: str) -> GmailAttachment | None:
    if not resume_attachment_id:
        return None
    row = (
        db.execute(
            text(
                """
                SELECT file_path, file_name, mime_type, file_content
                FROM resume_attachments
                WHERE id = :id AND user_id = :user_id AND is_available = true
                """
            ),
            {"id": resume_attachment_id, "user_id": user_id},
        )
        .mappings()
        .one_or_none()
    )
    if not row:
        return None
    return GmailAttachment(
        file_path=row["file_path"],
        file_name=row["file_name"],
        mime_type=row["mime_type"],
        file_content=row["file_content"],
    )


def _load_gmail_token_info(db: Session, user_id: str) -> dict[str, object] | None:
    row = (
        db.execute(
            text(
                """
                SELECT token_json
                FROM sending_provider_accounts
                WHERE user_id = :user_id AND provider_name = 'gmail' AND auth_status = 'authorized'
                """
            ),
            {"user_id": user_id},
        )
        .mappings()
        .one_or_none()
    )
    if not row or not row["token_json"]:
        return None
    token_json = row["token_json"]
    if isinstance(token_json, str):
        return dict(json.loads(token_json))
    return dict(token_json)


def _record_success(db: Session, row, provider_message_id: str | None) -> None:
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE send_requests
            SET status = 'sent', sent_at = :now, provider_message_id = :provider_message_id, updated_at = :now
            WHERE id = :id
            """
        ),
        {"id": row["id"], "now": now, "provider_message_id": provider_message_id},
    )
    if row["template_kind"] == "job_application":
        db.execute(
            text("UPDATE job_opportunity_details SET job_stage = 'applied', updated_at = :now WHERE opportunity_id = :opportunity_id"),
            {"opportunity_id": row["opportunity_id"], "now": now},
        )
    _insert_event(db, row, "sent", "sent", provider_message_id=provider_message_id)
    _update_bulk_batch_if_complete(db, row["bulk_batch_id"])


def _record_failure(db: Session, row, error_code: str, error_message: str) -> None:
    now = datetime.now(UTC)
    db.execute(
        text(
            """
            UPDATE send_requests
            SET status = 'failed', failed_at = :now, error_code = :error_code, error_message = :error_message, updated_at = :now
            WHERE id = :id
            """
        ),
        {"id": row["id"], "now": now, "error_code": error_code, "error_message": error_message},
    )
    _insert_event(db, row, "failed", "failed", error_code=error_code, error_message=error_message)
    _update_bulk_batch_if_complete(db, row["bulk_batch_id"])


def _insert_event(
    db: Session,
    row,
    event_type: str,
    status: str,
    *,
    provider_message_id: str | None = None,
    error_code: str | None = None,
    error_message: str | None = None,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO outreach_events (
              id, user_id, opportunity_id, draft_id, send_request_id, bulk_batch_id, channel, event_type,
              provider_name, provider_message_id, recipient_email, template_id, template_kind,
              resume_attachment_id, subject, status, error_code, error_message, payload, occurred_at
            )
            VALUES (
              :id, :user_id, :opportunity_id, :draft_id, :send_request_id, :bulk_batch_id, 'email', :event_type,
              'gmail', :provider_message_id, :recipient_email, :template_id, :template_kind,
              :resume_attachment_id, :subject, :status, :error_code, :error_message, '{}', :occurred_at
            )
            """
        ),
        {
            "id": str(uuid4()),
            "user_id": row["user_id"],
            "opportunity_id": row["opportunity_id"],
            "draft_id": row["draft_id"],
            "send_request_id": row["id"],
            "bulk_batch_id": row["bulk_batch_id"],
            "event_type": event_type,
            "provider_message_id": provider_message_id,
            "recipient_email": row["recipient_email"],
            "template_id": row["template_id"],
            "template_kind": row["template_kind"],
            "resume_attachment_id": row["resume_attachment_id"],
            "subject": row["subject_snapshot"],
            "status": status,
            "error_code": error_code,
            "error_message": error_message,
            "occurred_at": datetime.now(UTC),
        },
    )


def _update_bulk_batch_if_complete(db: Session, batch_id: str | None) -> None:
    if not batch_id:
        return
    pending = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM send_requests
            WHERE bulk_batch_id = :batch_id AND status IN ('approved', 'queued', 'sending')
            """
        ),
        {"batch_id": batch_id},
    ).scalar_one()
    if pending:
        return
    failures = db.execute(
        text("SELECT COUNT(*) FROM send_requests WHERE bulk_batch_id = :batch_id AND status = 'failed'"),
        {"batch_id": batch_id},
    ).scalar_one()
    db.execute(
        text("UPDATE bulk_send_batches SET status = :status, completed_at = :now, updated_at = :now WHERE id = :batch_id"),
        {
            "batch_id": batch_id,
            "status": "completed_with_failures" if failures else "completed",
            "now": datetime.now(UTC),
        },
    )
