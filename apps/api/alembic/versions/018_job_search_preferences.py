"""add saved job search preferences

Revision ID: 018_job_search_preferences
Revises: 017_sender_profile_email_cleanup
Create Date: 2026-05-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "018_job_search_preferences"
down_revision: str | None = "017_sender_profile_email_cleanup"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "job_search_preferences",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("opportunity_type", sa.String(length=50), nullable=False),
        sa.Column("last_search_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("last_search_keywords", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "opportunity_type", name="uq_job_search_preferences_user_opportunity_type"),
    )
    op.create_index("ix_job_search_preferences_user_id", "job_search_preferences", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_job_search_preferences_user_id", table_name="job_search_preferences")
    op.drop_table("job_search_preferences")
