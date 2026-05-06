"""allow ai generated bulk send requests without templates

Revision ID: 011_ai_bulk_email
Revises: 010_user_settings_portfolio_url
Create Date: 2026-05-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "011_ai_bulk_email"
down_revision: str | None = "010_user_settings_portfolio_url"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("bulk_send_batches", "template_id", existing_type=sa.String(length=36), nullable=True)
    op.alter_column("send_requests", "template_id", existing_type=sa.String(length=36), nullable=True)


def downgrade() -> None:
    op.alter_column("send_requests", "template_id", existing_type=sa.String(length=36), nullable=False)
    op.alter_column("bulk_send_batches", "template_id", existing_type=sa.String(length=36), nullable=False)
