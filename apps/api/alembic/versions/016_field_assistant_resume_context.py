"""add field assistant resume context selection

Revision ID: 016_field_assistant_ctx
Revises: 015_ai_field_assistant
Create Date: 2026-05-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision: str = "016_field_assistant_ctx"
down_revision: str | None = "015_ai_field_assistant"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "resume_attachments",
        sa.Column("include_in_field_assistant_context", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index(
        "ix_resume_attachments_field_assistant_context",
        "resume_attachments",
        ["user_id", "include_in_field_assistant_context", "is_available"],
    )
    op.execute(
        "UPDATE resume_attachments "
        "SET include_in_field_assistant_context = true "
        "WHERE is_available = true AND is_default = true"
    )


def downgrade() -> None:
    op.drop_index("ix_resume_attachments_field_assistant_context", table_name="resume_attachments")
    op.drop_column("resume_attachments", "include_in_field_assistant_context")
