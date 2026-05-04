"""full time email sending

Revision ID: 006_full_time_email_sending
Revises: 005_job_review_intelligence
Create Date: 2026-05-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "006_full_time_email_sending"
down_revision: str | None = "005_job_review_intelligence"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_settings",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("operator_name", sa.String(length=255)),
        sa.Column("operator_email", sa.String(length=320)),
        sa.Column("default_mode", sa.String(length=50), server_default="full_time", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "resume_attachments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.Integer()),
        sa.Column("sha256", sa.String(length=64)),
        sa.Column("is_available", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_attachments_uploaded_available", "resume_attachments", ["uploaded_at", "is_available"])

    op.create_table(
        "email_templates",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("mode", sa.String(length=50), server_default="full_time", nullable=False),
        sa.Column("template_kind", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("subject_template", sa.Text(), nullable=False),
        sa.Column("body_template", sa.Text(), nullable=False),
        sa.Column("variables_schema", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_email_templates_mode_kind_active", "email_templates", ["mode", "template_kind", "is_active"])

    op.create_table(
        "sending_provider_accounts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("provider_name", sa.String(length=50), server_default="gmail", nullable=False),
        sa.Column("display_email", sa.String(length=320)),
        sa.Column("display_name", sa.String(length=255)),
        sa.Column("auth_status", sa.String(length=50), server_default="not_configured", nullable=False),
        sa.Column("send_limit_per_day", sa.Integer(), server_default="25", nullable=False),
        sa.Column("last_checked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "bulk_send_batches",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("template_id", sa.String(length=36), sa.ForeignKey("email_templates.id"), nullable=False),
        sa.Column("resume_attachment_id", sa.String(length=36), sa.ForeignKey("resume_attachments.id")),
        sa.Column("selected_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("sendable_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("skipped_missing_contact_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("skipped_duplicate_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("blocked_invalid_contact_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("limit_blocked_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="previewed", nullable=False),
        sa.Column("items", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "email_drafts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id"), nullable=False),
        sa.Column("template_id", sa.String(length=36), sa.ForeignKey("email_templates.id"), nullable=False),
        sa.Column("template_kind", sa.String(length=50), nullable=False),
        sa.Column("resume_attachment_id", sa.String(length=36), sa.ForeignKey("resume_attachments.id")),
        sa.Column("to_email", sa.String(length=320), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("rendered_variables", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("warnings", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_email_drafts_opportunity", "email_drafts", ["opportunity_id"])

    op.create_table(
        "send_requests",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("draft_id", sa.String(length=36), sa.ForeignKey("email_drafts.id")),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id"), nullable=False),
        sa.Column("template_id", sa.String(length=36), sa.ForeignKey("email_templates.id"), nullable=False),
        sa.Column("template_kind", sa.String(length=50), nullable=False),
        sa.Column("resume_attachment_id", sa.String(length=36), sa.ForeignKey("resume_attachments.id")),
        sa.Column("recipient_email", sa.String(length=320), nullable=False),
        sa.Column("subject_snapshot", sa.Text(), nullable=False),
        sa.Column("body_snapshot", sa.Text(), nullable=False),
        sa.Column("resume_snapshot", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="approved", nullable=False),
        sa.Column("bulk_batch_id", sa.String(length=36), sa.ForeignKey("bulk_send_batches.id")),
        sa.Column("approved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("queued_at", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("failed_at", sa.DateTime(timezone=True)),
        sa.Column("error_code", sa.String(length=100)),
        sa.Column("error_message", sa.Text()),
        sa.Column("provider_message_id", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_send_requests_status_created", "send_requests", ["status", "created_at"])
    op.create_index("ix_send_requests_duplicate_guard", "send_requests", ["opportunity_id", "template_kind", "status"])

    op.create_table(
        "outreach_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id"), nullable=False),
        sa.Column("draft_id", sa.String(length=36), sa.ForeignKey("email_drafts.id")),
        sa.Column("send_request_id", sa.String(length=36), sa.ForeignKey("send_requests.id")),
        sa.Column("bulk_batch_id", sa.String(length=36), sa.ForeignKey("bulk_send_batches.id")),
        sa.Column("channel", sa.String(length=50), server_default="email", nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("provider_name", sa.String(length=50)),
        sa.Column("provider_message_id", sa.String(length=255)),
        sa.Column("recipient_email", sa.String(length=320), nullable=False),
        sa.Column("template_id", sa.String(length=36), sa.ForeignKey("email_templates.id")),
        sa.Column("template_kind", sa.String(length=50)),
        sa.Column("resume_attachment_id", sa.String(length=36), sa.ForeignKey("resume_attachments.id")),
        sa.Column("subject", sa.Text()),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_code", sa.String(length=100)),
        sa.Column("error_message", sa.Text()),
        sa.Column("payload", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_outreach_events_opportunity_occurred", "outreach_events", ["opportunity_id", "occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_outreach_events_opportunity_occurred", table_name="outreach_events")
    op.drop_table("outreach_events")
    op.drop_index("ix_send_requests_duplicate_guard", table_name="send_requests")
    op.drop_index("ix_send_requests_status_created", table_name="send_requests")
    op.drop_table("send_requests")
    op.drop_index("ix_email_drafts_opportunity", table_name="email_drafts")
    op.drop_table("email_drafts")
    op.drop_table("bulk_send_batches")
    op.drop_table("sending_provider_accounts")
    op.drop_index("ix_email_templates_mode_kind_active", table_name="email_templates")
    op.drop_table("email_templates")
    op.drop_index("ix_resume_attachments_uploaded_available", table_name="resume_attachments")
    op.drop_table("resume_attachments")
    op.drop_table("user_settings")
