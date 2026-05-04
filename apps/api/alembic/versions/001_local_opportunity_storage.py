"""local opportunity storage

Revision ID: 001_local_opportunity_storage
Revises:
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_local_opportunity_storage"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "keyword_sets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("opportunity_type", sa.String(length=50), nullable=False),
        sa.Column("terms", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("opportunity_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=500)),
        sa.Column("organization_name", sa.String(length=255)),
        sa.Column("source_name", sa.String(length=100)),
        sa.Column("source_url", sa.Text()),
        sa.Column("source_query", sa.Text()),
        sa.Column("source_evidence", sa.Text(), nullable=False),
        sa.Column("operator_notes", sa.Text()),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "job_opportunity_details",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id"), nullable=False, unique=True),
        sa.Column("company_name", sa.String(length=255)),
        sa.Column("role_title", sa.String(length=500)),
        sa.Column("post_headline", sa.String(length=500)),
        sa.Column("job_description", sa.Text()),
        sa.Column("contact_channel_type", sa.String(length=50)),
        sa.Column("contact_channel_value", sa.String(length=500), nullable=False),
        sa.Column("contact_email", sa.String(length=320)),
        sa.Column("application_url", sa.Text()),
        sa.Column("linkedin_url", sa.Text()),
        sa.Column("matched_keywords", sa.JSON(), nullable=False),
        sa.Column("dedupe_key", sa.String(length=1000)),
        sa.Column("job_stage", sa.String(length=50), nullable=False),
        sa.Column("response_notes", sa.Text()),
        sa.Column("interview_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_job_opportunity_details_dedupe_key", "job_opportunity_details", ["dedupe_key"])
    op.create_table(
        "opportunity_keyword_matches",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("opportunity_id", sa.String(length=36), sa.ForeignKey("opportunities.id"), nullable=False),
        sa.Column("keyword_set_id", sa.String(length=36), sa.ForeignKey("keyword_sets.id")),
        sa.Column("matched_term", sa.String(length=255), nullable=False),
        sa.Column("match_context", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("opportunity_keyword_matches")
    op.drop_index("ix_job_opportunity_details_dedupe_key", table_name="job_opportunity_details")
    op.drop_table("job_opportunity_details")
    op.drop_table("opportunities")
    op.drop_table("keyword_sets")
