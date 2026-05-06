from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import DEFAULT_LOCAL_USER_ID


def new_id() -> str:
    return str(uuid4())


class TemplateMode(StrEnum):
    FULL_TIME = "full_time"


class TemplateKind(StrEnum):
    JOB_APPLICATION = "job_application"
    JOB_FOLLOW_UP = "job_follow_up"


class DraftStatus(StrEnum):
    DRAFT = "draft"
    APPROVED = "approved"
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SendRequestStatus(StrEnum):
    APPROVED = "approved"
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"
    SKIPPED_DUPLICATE = "skipped_duplicate"
    SKIPPED_MISSING_CONTACT = "skipped_missing_contact"
    SKIPPED_INVALID_CONTACT = "skipped_invalid_contact"


class BulkBatchStatus(StrEnum):
    PREVIEWED = "previewed"
    APPROVED = "approved"
    QUEUED = "queued"
    COMPLETED = "completed"
    COMPLETED_WITH_FAILURES = "completed_with_failures"
    CANCELLED = "cancelled"


class ProviderAuthStatus(StrEnum):
    NOT_CONFIGURED = "not_configured"
    AUTHORIZATION_REQUIRED = "authorization_required"
    AUTHORIZED = "authorized"
    EXPIRED = "expired"
    FAILED = "failed"


class OutreachEventType(StrEnum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    SKIPPED_DUPLICATE = "skipped_duplicate"
    SKIPPED_MISSING_CONTACT = "skipped_missing_contact"
    SKIPPED_INVALID_CONTACT = "skipped_invalid_contact"


class ResumeAttachment(Base):
    __tablename__ = "resume_attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_content: Mapped[bytes | None] = mapped_column(LargeBinary)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer)
    sha256: Mapped[str | None] = mapped_column(String(64))
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(50), default=TemplateMode.FULL_TIME.value, nullable=False)
    template_kind: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject_template: Mapped[str] = mapped_column(Text, nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    variables_schema: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SendingProviderAccount(Base):
    __tablename__ = "sending_provider_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    provider_name: Mapped[str] = mapped_column(String(50), default="gmail", nullable=False)
    display_email: Mapped[str | None] = mapped_column(String(320))
    display_name: Mapped[str | None] = mapped_column(String(255))
    auth_status: Mapped[str] = mapped_column(String(50), default=ProviderAuthStatus.NOT_CONFIGURED.value, nullable=False)
    send_limit_per_day: Mapped[int | None] = mapped_column(Integer)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    token_json: Mapped[dict[str, object] | None] = mapped_column(JSON)
    token_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class BulkSendBatch(Base):
    __tablename__ = "bulk_send_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    template_id: Mapped[str | None] = mapped_column(ForeignKey("email_templates.id"))
    resume_attachment_id: Mapped[str | None] = mapped_column(ForeignKey("resume_attachments.id"))
    selected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sendable_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skipped_missing_contact_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skipped_duplicate_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked_invalid_contact_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    limit_blocked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=BulkBatchStatus.PREVIEWED.value, nullable=False)
    items: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class EmailDraft(Base):
    __tablename__ = "email_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    opportunity_id: Mapped[str] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    template_id: Mapped[str] = mapped_column(ForeignKey("email_templates.id"), nullable=False)
    template_kind: Mapped[str] = mapped_column(String(50), nullable=False)
    resume_attachment_id: Mapped[str | None] = mapped_column(ForeignKey("resume_attachments.id"))
    to_email: Mapped[str] = mapped_column(String(320), nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    rendered_variables: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    warnings: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=DraftStatus.DRAFT.value, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    template: Mapped[EmailTemplate] = relationship()
    resume_attachment: Mapped[ResumeAttachment | None] = relationship()


class SendRequest(Base):
    __tablename__ = "send_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    draft_id: Mapped[str | None] = mapped_column(ForeignKey("email_drafts.id"))
    opportunity_id: Mapped[str] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    template_id: Mapped[str | None] = mapped_column(ForeignKey("email_templates.id"))
    template_kind: Mapped[str] = mapped_column(String(50), nullable=False)
    resume_attachment_id: Mapped[str | None] = mapped_column(ForeignKey("resume_attachments.id"))
    recipient_email: Mapped[str] = mapped_column(String(320), nullable=False)
    subject_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    body_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    resume_snapshot: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=SendRequestStatus.APPROVED.value, nullable=False)
    bulk_batch_id: Mapped[str | None] = mapped_column(ForeignKey("bulk_send_batches.id"))
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    queued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_code: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None] = mapped_column(Text)
    provider_message_id: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    draft: Mapped[EmailDraft | None] = relationship()
    resume_attachment: Mapped[ResumeAttachment | None] = relationship()


class OutreachEvent(Base):
    __tablename__ = "outreach_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    opportunity_id: Mapped[str] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    draft_id: Mapped[str | None] = mapped_column(ForeignKey("email_drafts.id"))
    send_request_id: Mapped[str | None] = mapped_column(ForeignKey("send_requests.id"))
    bulk_batch_id: Mapped[str | None] = mapped_column(ForeignKey("bulk_send_batches.id"))
    channel: Mapped[str] = mapped_column(String(50), default="email", nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_name: Mapped[str | None] = mapped_column(String(50))
    provider_message_id: Mapped[str | None] = mapped_column(String(255))
    recipient_email: Mapped[str] = mapped_column(String(320), nullable=False)
    template_id: Mapped[str | None] = mapped_column(ForeignKey("email_templates.id"))
    template_kind: Mapped[str | None] = mapped_column(String(50))
    resume_attachment_id: Mapped[str | None] = mapped_column(ForeignKey("resume_attachments.id"))
    subject: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None] = mapped_column(Text)
    payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
