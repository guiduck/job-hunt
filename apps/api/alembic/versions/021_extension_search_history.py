"""add linkedin search history raw counts

Revision ID: 021_extension_search_history
Revises: 020_career_page_search
Create Date: 2026-07-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "021_extension_search_history"
down_revision: str | None = "020_career_page_search"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    add_column_if_missing("job_search_runs", sa.Column("raw_linkedin_result_count", sa.Integer(), nullable=True))
    add_column_if_missing("job_search_runs", sa.Column("raw_linkedin_result_count_source", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("job_search_runs", "raw_linkedin_result_count_source")
    op.drop_column("job_search_runs", "raw_linkedin_result_count")


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)