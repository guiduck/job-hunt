from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


class EmailTemplateCreate(BaseModel):
    mode: TemplateMode = TemplateMode.FULL_TIME
    template_kind: TemplateKind
    name: str
    subject_template: str
    body_template: str
    variables_schema: dict[str, object] = Field(default_factory=dict)
    is_active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: str | None = None
    subject_template: str | None = None
    body_template: str | None = None
    variables_schema: dict[str, object] | None = None
    is_active: bool | None = None


class EmailTemplate(EmailTemplateCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class TemplatePreviewRequest(BaseModel):
    opportunity_id: str | None = None
    resume_attachment_id: str | None = None
    sample_values: dict[str, object] = Field(default_factory=dict)


class RenderedPreview(BaseModel):
    subject: str
    body: str
    warnings: list[str] = Field(default_factory=list)
    rendered_variables: dict[str, object] = Field(default_factory=dict)


class SendingProviderAccount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider_name: str = "gmail"
    display_email: EmailStr | None = None
    display_name: str | None = None
    auth_status: ProviderAuthStatus
    send_limit_per_day: int | None = Field(default=None, ge=1)
    last_checked_at: datetime | None = None
    token_updated_at: datetime | None = None


class GoogleOAuthStartResponse(BaseModel):
    auth_url: str


class EmailDraftCreate(BaseModel):
    opportunity_id: str
    template_id: str
    resume_attachment_id: str | None = None


class EmailDraftUpdate(BaseModel):
    to_email: EmailStr | None = None
    subject: str | None = None
    body: str | None = None
    resume_attachment_id: str | None = None


class EmailDraft(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    opportunity_id: str
    template_id: str
    template_kind: TemplateKind
    resume_attachment_id: str | None = None
    to_email: EmailStr
    subject: str
    body: str
    warnings: list[str] = Field(default_factory=list)
    status: DraftStatus
    created_at: datetime
    updated_at: datetime


class SendRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    draft_id: str | None = None
    opportunity_id: str
    template_id: str | None = None
    template_kind: TemplateKind
    resume_attachment_id: str | None = None
    recipient_email: EmailStr
    subject_snapshot: str
    body_snapshot: str
    status: SendRequestStatus
    error_code: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class BulkPreviewRequest(BaseModel):
    opportunity_ids: list[str] = Field(max_length=50)
    template_id: str
    resume_attachment_id: str | None = None


class BulkAIGenerateRequest(BaseModel):
    opportunity_ids: list[str] = Field(max_length=50)
    resume_attachment_id: str | None = None
    template_id: str | None = None


class BulkSendItemUpdate(BaseModel):
    recipient_email: str | None = None
    subject: str | None = None
    body: str | None = None
    is_skipped: bool | None = None


class BulkSendItem(BaseModel):
    opportunity_id: str
    recipient_email: str | None = None
    outcome: str
    reason: str | None = None
    draft_id: str | None = None
    send_request_id: str | None = None
    subject: str | None = None
    body: str | None = None
    is_skipped: bool = False
    ai_error_code: str | None = None
    retryable: bool = False


class BulkSendBatch(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: BulkBatchStatus
    selected_count: int
    sendable_count: int
    skipped_missing_contact_count: int
    skipped_duplicate_count: int
    blocked_invalid_contact_count: int
    limit_blocked_count: int
    items: list[BulkSendItem] = Field(default_factory=list)


class OutreachEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    opportunity_id: str
    draft_id: str | None = None
    send_request_id: str | None = None
    bulk_batch_id: str | None = None
    channel: str = "email"
    event_type: str
    provider_name: str | None = None
    provider_message_id: str | None = None
    recipient_email: EmailStr
    template_id: str | None = None
    template_kind: TemplateKind | None = None
    resume_attachment_id: str | None = None
    subject: str | None = None
    status: str
    error_message: str | None = None
    occurred_at: datetime
