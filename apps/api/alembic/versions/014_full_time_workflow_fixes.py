"""add full time workflow fixes foundation

Revision ID: 014_full_time_workflow_fixes
Revises: 013_google_jobs_email_discovery
Create Date: 2026-05-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "014_full_time_workflow_fixes"
down_revision: str | None = "013_google_jobs_email_discovery"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "google_identity_links",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="google"),
        sa.Column("provider_subject", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_subject", name="uq_google_identity_links_provider_subject"),
    )
    op.create_index("ix_google_identity_links_email", "google_identity_links", ["email"])
    op.create_index("ix_google_identity_links_user_id", "google_identity_links", ["user_id"])

    op.add_column("user_settings", sa.Column("operator_linkedin_url", sa.String(length=2048), nullable=True))

    op.create_table(
        "ai_generation_batches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="queued"),
        sa.Column("selected_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("resume_attachment_id", sa.String(length=36), nullable=True),
        sa.Column("template_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["resume_attachment_id"], ["resume_attachments.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["email_templates.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_generation_batches_status", "ai_generation_batches", ["status"])
    op.create_index("ix_ai_generation_batches_user_id", "ai_generation_batches", ["user_id"])

    op.create_table(
        "ai_generation_batch_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("opportunity_id", sa.String(length=36), nullable=False),
        sa.Column("recipient_email", sa.String(length=320), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="queued"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("subject", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("retryable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["ai_generation_batches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_generation_batch_items_batch_id", "ai_generation_batch_items", ["batch_id"])
    op.create_index("ix_ai_generation_batch_items_opportunity_id", "ai_generation_batch_items", ["opportunity_id"])
    op.create_index("ix_ai_generation_batch_items_status", "ai_generation_batch_items", ["status"])


def downgrade() -> None:
    op.drop_index("ix_ai_generation_batch_items_status", table_name="ai_generation_batch_items")
    op.drop_index("ix_ai_generation_batch_items_opportunity_id", table_name="ai_generation_batch_items")
    op.drop_index("ix_ai_generation_batch_items_batch_id", table_name="ai_generation_batch_items")
    op.drop_table("ai_generation_batch_items")

    op.drop_index("ix_ai_generation_batches_user_id", table_name="ai_generation_batches")
    op.drop_index("ix_ai_generation_batches_status", table_name="ai_generation_batches")
    op.drop_table("ai_generation_batches")

    op.drop_column("user_settings", "operator_linkedin_url")

    op.drop_index("ix_google_identity_links_user_id", table_name="google_identity_links")
    op.drop_index("ix_google_identity_links_email", table_name="google_identity_links")
    op.drop_table("google_identity_links")
