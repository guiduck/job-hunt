"""add career page search metadata

Revision ID: 020_career_page_search
Revises: 019_linkedin_poster_titles
Create Date: 2026-06-02
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "020_career_page_search"
down_revision: str | None = "019_linkedin_poster_titles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    add_column_if_missing("job_search_runs", sa.Column("search_kind", sa.String(length=50), nullable=False, server_default="linkedin"))
    add_column_if_missing("job_search_runs", sa.Column("selected_source_keys", sa.JSON(), nullable=False, server_default="[]"))
    add_column_if_missing("job_search_runs", sa.Column("source_diagnostics", sa.JSON(), nullable=False, server_default="{}"))
    add_column_if_missing("job_search_runs", sa.Column("stop_reason", sa.String(length=100), nullable=True))
    add_column_if_missing("job_search_runs", sa.Column("accepted_limit", sa.Integer(), nullable=True))
    add_column_if_missing("job_search_runs", sa.Column("inspected_cap", sa.Integer(), nullable=True))
    add_column_if_missing("job_search_runs", sa.Column("provider_metadata", sa.JSON(), nullable=False, server_default="{}"))
    create_index_if_missing("job_search_runs", "ix_job_search_runs_search_kind", ["search_kind"])

    add_column_if_missing("job_search_candidates", sa.Column("application_url", sa.Text(), nullable=True))
    add_column_if_missing("job_search_candidates", sa.Column("application_kind", sa.String(length=50), nullable=True))
    add_column_if_missing("job_search_candidates", sa.Column("selected_source_key", sa.String(length=100), nullable=True))
    add_column_if_missing("job_search_candidates", sa.Column("source_name", sa.String(length=100), nullable=True))
    add_column_if_missing("job_search_candidates", sa.Column("provider_metadata", sa.JSON(), nullable=False, server_default="{}"))
    add_column_if_missing("job_search_candidates", sa.Column("external_job_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("job_search_candidates", "external_job_id")
    op.drop_column("job_search_candidates", "provider_metadata")
    op.drop_column("job_search_candidates", "source_name")
    op.drop_column("job_search_candidates", "selected_source_key")
    op.drop_column("job_search_candidates", "application_kind")
    op.drop_column("job_search_candidates", "application_url")

    op.drop_index("ix_job_search_runs_search_kind", table_name="job_search_runs")
    op.drop_column("job_search_runs", "provider_metadata")
    op.drop_column("job_search_runs", "inspected_cap")
    op.drop_column("job_search_runs", "accepted_limit")
    op.drop_column("job_search_runs", "stop_reason")
    op.drop_column("job_search_runs", "source_diagnostics")
    op.drop_column("job_search_runs", "selected_source_keys")
    op.drop_column("job_search_runs", "search_kind")


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def create_index_if_missing(table_name: str, index_name: str, columns: list[str]) -> None:
    inspector = sa.inspect(op.get_bind())
    indexes = {item["name"] for item in inspector.get_indexes(table_name)}
    if index_name not in indexes:
        op.create_index(index_name, table_name, columns)
