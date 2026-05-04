"""google oauth and resume upload

Revision ID: 007_google_oauth_resume_upload
Revises: 006_full_time_email_sending
Create Date: 2026-05-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "007_google_oauth_resume_upload"
down_revision: str | None = "006_full_time_email_sending"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("resume_attachments", sa.Column("file_content", sa.LargeBinary()))
    op.add_column("resume_attachments", sa.Column("is_default", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.create_index("ix_resume_attachments_default_available", "resume_attachments", ["is_default", "is_available"])

    op.add_column("sending_provider_accounts", sa.Column("token_json", sa.JSON()))
    op.add_column("sending_provider_accounts", sa.Column("token_updated_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    op.drop_column("sending_provider_accounts", "token_updated_at")
    op.drop_column("sending_provider_accounts", "token_json")
    op.drop_index("ix_resume_attachments_default_available", table_name="resume_attachments")
    op.drop_column("resume_attachments", "is_default")
    op.drop_column("resume_attachments", "file_content")
