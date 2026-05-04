"""linkedin search provider metadata

Revision ID: 003_linkedin_search_provider
Revises: 002_job_search_runs
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "003_linkedin_search_provider"
down_revision: str | None = "002_job_search_runs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("job_search_runs", sa.Column("hiring_intent_terms", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("job_search_runs", sa.Column("collection_source_types", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("job_search_runs", sa.Column("provided_source_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("job_search_runs", sa.Column("provider_status", sa.String(length=50), nullable=False, server_default="not_started"))
    op.add_column("job_search_runs", sa.Column("provider_error_code", sa.String(length=100)))
    op.add_column("job_search_runs", sa.Column("provider_error_message", sa.Text()))

    op.add_column("job_search_candidates", sa.Column("collection_source_type", sa.String(length=50)))
    op.add_column("job_search_candidates", sa.Column("hiring_intent_term", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("provider_name", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("provider_status", sa.String(length=50)))
    op.add_column("job_search_candidates", sa.Column("provider_error_code", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("poster_profile_url", sa.Text()))
    op.add_column("job_search_candidates", sa.Column("contact_priority", sa.String(length=50)))
    op.add_column("job_search_candidates", sa.Column("raw_excerpt", sa.Text()))

    op.add_column("job_opportunity_details", sa.Column("poster_profile_url", sa.Text()))
    op.add_column("job_opportunity_details", sa.Column("contact_priority", sa.String(length=50)))
    op.add_column("job_opportunity_details", sa.Column("hiring_intent_term", sa.String(length=100)))
    op.add_column("job_opportunity_details", sa.Column("collection_source_type", sa.String(length=50)))


def downgrade() -> None:
    op.drop_column("job_opportunity_details", "collection_source_type")
    op.drop_column("job_opportunity_details", "hiring_intent_term")
    op.drop_column("job_opportunity_details", "contact_priority")
    op.drop_column("job_opportunity_details", "poster_profile_url")

    op.drop_column("job_search_candidates", "raw_excerpt")
    op.drop_column("job_search_candidates", "contact_priority")
    op.drop_column("job_search_candidates", "poster_profile_url")
    op.drop_column("job_search_candidates", "provider_error_code")
    op.drop_column("job_search_candidates", "provider_status")
    op.drop_column("job_search_candidates", "provider_name")
    op.drop_column("job_search_candidates", "hiring_intent_term")
    op.drop_column("job_search_candidates", "collection_source_type")

    op.drop_column("job_search_runs", "provider_error_message")
    op.drop_column("job_search_runs", "provider_error_code")
    op.drop_column("job_search_runs", "provider_status")
    op.drop_column("job_search_runs", "provided_source_count")
    op.drop_column("job_search_runs", "collection_source_types")
    op.drop_column("job_search_runs", "hiring_intent_terms")
