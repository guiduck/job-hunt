"""add ai field assistant

Revision ID: 015_ai_field_assistant
Revises: 014_full_time_workflow_fixes
Create Date: 2026-05-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "015_ai_field_assistant"
down_revision: str | None = "014_full_time_workflow_fixes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "field_assistant_activations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("scope_type", sa.String(length=32), nullable=False),
        sa.Column("scope_value", sa.String(length=2048), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "scope_type", "scope_value", name="uq_field_assistant_activations_user_scope"),
    )
    op.create_index("ix_field_assistant_activations_user_id", "field_assistant_activations", ["user_id"])

    op.create_table(
        "field_response_suggestions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("keyword", sa.String(length=120), nullable=False),
        sa.Column("field_label", sa.Text(), nullable=True),
        sa.Column("field_context_summary", sa.Text(), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_response_suggestions_keyword", "field_response_suggestions", ["keyword"])
    op.create_index("ix_field_response_suggestions_user_id", "field_response_suggestions", ["user_id"])

    op.create_table(
        "field_answer_generations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("keyword", sa.String(length=120), nullable=False),
        sa.Column("field_label", sa.Text(), nullable=True),
        sa.Column("page_origin", sa.String(length=2048), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="drafted"),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_answer_generations_keyword", "field_answer_generations", ["keyword"])
    op.create_index("ix_field_answer_generations_user_id", "field_answer_generations", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_field_answer_generations_user_id", table_name="field_answer_generations")
    op.drop_index("ix_field_answer_generations_keyword", table_name="field_answer_generations")
    op.drop_table("field_answer_generations")

    op.drop_index("ix_field_response_suggestions_user_id", table_name="field_response_suggestions")
    op.drop_index("ix_field_response_suggestions_keyword", table_name="field_response_suggestions")
    op.drop_table("field_response_suggestions")

    op.drop_index("ix_field_assistant_activations_user_id", table_name="field_assistant_activations")
    op.drop_table("field_assistant_activations")
