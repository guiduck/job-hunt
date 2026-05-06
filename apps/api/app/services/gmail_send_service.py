from __future__ import annotations

import base64
import json
from datetime import UTC, datetime
from email.message import EmailMessage
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.email import ProviderAuthStatus, ResumeAttachment, SendingProviderAccount, SendRequest, SendRequestStatus
from app.services.email_send_service import record_send_failure, record_send_success


def send_request_via_gmail(db: Session, send_request: SendRequest) -> SendRequest:
    send_request.status = SendRequestStatus.SENDING.value
    send_request.queued_at = send_request.queued_at or datetime.now(UTC)
    db.add(send_request)
    db.commit()
    db.refresh(send_request)

    token_info = _load_gmail_token_info(db, send_request.user_id)
    if not token_info:
        return record_send_failure(db, send_request, "gmail_not_connected", "Connect Google before sending email.")

    attachment = _load_attachment(db, send_request.resume_attachment_id, send_request.user_id)
    if send_request.resume_attachment_id and attachment is None:
        return record_send_failure(db, send_request, "resume_unavailable", "Selected resume is no longer available.")

    try:
        service = _build_gmail_service(token_info)
        raw = _build_raw_message(send_request, attachment)
        response = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    except Exception as exc:  # pragma: no cover - google client exceptions vary.
        return record_send_failure(db, send_request, "gmail_send_failed", str(exc))

    return record_send_success(db, send_request, response.get("id"))


def _load_gmail_token_info(db: Session, user_id: str) -> dict[str, object] | None:
    account = db.scalar(
        select(SendingProviderAccount).where(
            SendingProviderAccount.user_id == user_id,
            SendingProviderAccount.provider_name == "gmail",
            SendingProviderAccount.auth_status == ProviderAuthStatus.AUTHORIZED.value,
        )
    )
    if not account or not account.token_json:
        return None
    if isinstance(account.token_json, str):
        return dict(json.loads(account.token_json))
    return dict(account.token_json)


def _load_attachment(db: Session, resume_attachment_id: str | None, user_id: str) -> ResumeAttachment | None:
    if not resume_attachment_id:
        return None
    return db.scalar(
        select(ResumeAttachment).where(
            ResumeAttachment.id == resume_attachment_id,
            ResumeAttachment.user_id == user_id,
            ResumeAttachment.is_available.is_(True),
        )
    )


def _build_gmail_service(token_info: dict[str, object]):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    settings = get_settings()
    credentials = Credentials.from_authorized_user_info(
        token_info,
        scopes=[scope.strip() for scope in settings.gmail_oauth_scopes.split(",") if scope.strip()],
    )
    return build("gmail", "v1", credentials=credentials)


def _build_raw_message(send_request: SendRequest, attachment: ResumeAttachment | None) -> str:
    message = EmailMessage()
    message["To"] = send_request.recipient_email
    message["Subject"] = send_request.subject_snapshot
    message.set_content(send_request.body_snapshot)

    if attachment:
        content = attachment.file_content if attachment.file_content is not None else Path(attachment.file_path).read_bytes()
        maintype, _, subtype = attachment.mime_type.partition("/")
        message.add_attachment(
            content,
            maintype=maintype or "application",
            subtype=subtype or "octet-stream",
            filename=attachment.file_name,
        )

    return base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
