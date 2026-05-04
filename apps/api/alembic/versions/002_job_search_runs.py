"""job search runs

Revision ID: 002_job_search_runs
Revises: 001_local_opportunity_storage
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_job_search_runs"
down_revision: str | None = "001_local_opportunity_storage"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "job_search_runs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("keyword_set_id", sa.String(length=36), sa.ForeignKey("keyword_sets.id")),
        sa.Column("requested_keywords", sa.JSON(), nullable=False),
        sa.Column("source_name", sa.String(length=100), nullable=False),
        sa.Column("candidate_limit", sa.Integer(), nullable=False),
        sa.Column("inspected_count", sa.Integer(), nullable=False),
        sa.Column("accepted_count", sa.Integer(), nullable=False),
        sa.Column("rejected_count", sa.Integer(), nullable=False),
        sa.Column("duplicate_count", sa.Integer(), nullable=False),
        sa.Column("cap_reached", sa.Boolean(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "job_search_candidates",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("run_id", sa.String(length=36), sa.ForeignKey("job_search_runs.id"), nullable=False),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id")),
        sa.Column("outcome", sa.String(length=50), nullable=False),
        sa.Column("company_name", sa.String(length=255)),
        sa.Column("role_title", sa.String(length=500)),
        sa.Column("post_headline", sa.String(length=500)),
        sa.Column("job_description", sa.Text()),
        sa.Column("contact_channel_type", sa.String(length=50)),
        sa.Column("contact_channel_value", sa.String(length=500)),
        sa.Column("source_url", sa.Text()),
        sa.Column("source_query", sa.Text(), nullable=False),
        sa.Column("source_evidence", sa.Text()),
        sa.Column("matched_keywords", sa.JSON(), nullable=False),
        sa.Column("dedupe_key", sa.String(length=1000)),
        sa.Column("rejection_reason", sa.Text()),
        sa.Column("inspected_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_job_search_candidates_dedupe_key", "job_search_candidates", ["dedupe_key"])


def downgrade() -> None:
    op.drop_index("ix_job_search_candidates_dedupe_key", table_name="job_search_candidates")
    op.drop_table("job_search_candidates")
    op.drop_table("job_search_runs")
