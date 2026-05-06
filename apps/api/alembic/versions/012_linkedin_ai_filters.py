"""add linkedin ai filter fields

Revision ID: 012_linkedin_ai_filters
Revises: 011_ai_bulk_email
Create Date: 2026-05-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "012_linkedin_ai_filters"
down_revision: str | None = "011_ai_bulk_email"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("job_search_runs", sa.Column("search_query", sa.Text(), nullable=True))
    op.add_column(
        "job_search_runs",
        sa.Column("search_sort_order", sa.String(length=20), nullable=False, server_default="recent"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filters_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_settings", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_status", sa.String(length=50), nullable=False, server_default="skipped"),
    )
    op.add_column("job_search_runs", sa.Column("ai_filter_error_code", sa.String(length=100), nullable=True))
    op.add_column("job_search_runs", sa.Column("ai_filter_error_message", sa.Text(), nullable=True))
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_inspected_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_passed_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_rejected_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_fallback_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_failed_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_search_runs",
        sa.Column("ai_filter_skipped_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_job_search_runs_ai_filters_enabled", "job_search_runs", ["ai_filters_enabled"])

    op.add_column("job_search_candidates", sa.Column("passes_ai_filter", sa.Boolean(), nullable=True))
    op.add_column(
        "job_search_candidates",
        sa.Column("ai_filter_status", sa.String(length=50), nullable=False, server_default="skipped"),
    )
    op.add_column("job_search_candidates", sa.Column("ai_filter_reason", sa.Text(), nullable=True))
    op.add_column("job_search_candidates", sa.Column("ai_filter_confidence", sa.Float(), nullable=True))
    op.add_column(
        "job_search_candidates",
        sa.Column("ai_filter_signals", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column("job_search_candidates", sa.Column("ai_filter_error_code", sa.String(length=100), nullable=True))
    op.add_column("job_search_candidates", sa.Column("ai_filter_error_message", sa.Text(), nullable=True))
    op.add_column("job_search_candidates", sa.Column("ai_filter_model_name", sa.String(length=255), nullable=True))
    op.add_column("job_search_candidates", sa.Column("ai_filter_prompt_version", sa.String(length=100), nullable=True))
    op.create_index("ix_job_search_candidates_ai_filter_status", "job_search_candidates", ["ai_filter_status"])


def downgrade() -> None:
    op.drop_index("ix_job_search_candidates_ai_filter_status", table_name="job_search_candidates")
    op.drop_column("job_search_candidates", "ai_filter_prompt_version")
    op.drop_column("job_search_candidates", "ai_filter_model_name")
    op.drop_column("job_search_candidates", "ai_filter_error_message")
    op.drop_column("job_search_candidates", "ai_filter_error_code")
    op.drop_column("job_search_candidates", "ai_filter_signals")
    op.drop_column("job_search_candidates", "ai_filter_confidence")
    op.drop_column("job_search_candidates", "ai_filter_reason")
    op.drop_column("job_search_candidates", "ai_filter_status")
    op.drop_column("job_search_candidates", "passes_ai_filter")

    op.drop_index("ix_job_search_runs_ai_filters_enabled", table_name="job_search_runs")
    op.drop_column("job_search_runs", "ai_filter_skipped_count")
    op.drop_column("job_search_runs", "ai_filter_failed_count")
    op.drop_column("job_search_runs", "ai_filter_fallback_count")
    op.drop_column("job_search_runs", "ai_filter_rejected_count")
    op.drop_column("job_search_runs", "ai_filter_passed_count")
    op.drop_column("job_search_runs", "ai_filter_inspected_count")
    op.drop_column("job_search_runs", "ai_filter_error_message")
    op.drop_column("job_search_runs", "ai_filter_error_code")
    op.drop_column("job_search_runs", "ai_filter_status")
    op.drop_column("job_search_runs", "ai_filter_settings")
    op.drop_column("job_search_runs", "ai_filters_enabled")
    op.drop_column("job_search_runs", "search_sort_order")
    op.drop_column("job_search_runs", "search_query")
