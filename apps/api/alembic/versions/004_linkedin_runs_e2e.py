"""linkedin runs e2e collection inputs

Revision ID: 004_linkedin_runs_e2e
Revises: 003_linkedin_search_provider
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "004_linkedin_runs_e2e"
down_revision: str | None = "003_linkedin_search_provider"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "linkedin_collection_inputs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("run_id", sa.String(length=36), sa.ForeignKey("job_search_runs.id"), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_url", sa.Text()),
        sa.Column("provided_text", sa.Text()),
        sa.Column("label", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_linkedin_collection_inputs_run_id", "linkedin_collection_inputs", ["run_id"])


def downgrade() -> None:
    op.drop_index("ix_linkedin_collection_inputs_run_id", table_name="linkedin_collection_inputs")
    op.drop_table("linkedin_collection_inputs")
