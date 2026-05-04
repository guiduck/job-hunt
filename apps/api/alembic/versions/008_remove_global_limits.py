"""remove global send and search limits

Revision ID: 008_remove_global_limits
Revises: 007_google_oauth_resume_upload
Create Date: 2026-05-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "008_remove_global_limits"
down_revision: str | None = "007_google_oauth_resume_upload"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("job_search_runs", "candidate_limit", existing_type=sa.Integer(), nullable=True)
    op.alter_column(
        "sending_provider_accounts",
        "send_limit_per_day",
        existing_type=sa.Integer(),
        nullable=True,
        server_default=None,
    )


def downgrade() -> None:
    op.execute("UPDATE job_search_runs SET candidate_limit = 50 WHERE candidate_limit IS NULL")
    op.execute("UPDATE sending_provider_accounts SET send_limit_per_day = 25 WHERE send_limit_per_day IS NULL")
    op.alter_column("job_search_runs", "candidate_limit", existing_type=sa.Integer(), nullable=False)
    op.alter_column(
        "sending_provider_accounts",
        "send_limit_per_day",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="25",
    )
