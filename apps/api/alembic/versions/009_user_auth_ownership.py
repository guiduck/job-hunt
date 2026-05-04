"""add user auth and ownership

Revision ID: 009_user_auth_ownership
Revises: 008_remove_global_limits
Create Date: 2026-05-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "009_user_auth_ownership"
down_revision: str | None = "008_remove_global_limits"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_LOCAL_USER_ID = "00000000-0000-4000-8000-000000000007"
DEFAULT_LOCAL_USER_EMAIL = "local@example.com"

OWNED_TABLES = [
    "user_settings",
    "resume_attachments",
    "email_templates",
    "sending_provider_accounts",
    "job_search_runs",
    "job_search_candidates",
    "linkedin_collection_inputs",
    "opportunities",
    "email_drafts",
    "send_requests",
    "bulk_send_batches",
    "outreach_events",
]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("subscription_status", sa.String(length=50), nullable=False, server_default="inactive"),
        sa.Column("subscription_plan", sa.String(length=50), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_auth_sessions_token_hash"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_token_hash", "auth_sessions", ["token_hash"])

    op.create_table(
        "password_reset_requests",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("requested_email", sa.String(length=320), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_password_reset_requests_token_hash"),
    )
    op.create_index("ix_password_reset_requests_user_id", "password_reset_requests", ["user_id"])
    op.create_index("ix_password_reset_requests_token_hash", "password_reset_requests", ["token_hash"])

    # Placeholder hash marks migrated local data ownership; users can reset password after auth is live.
    bind = op.get_bind()
    existing_user = bind.execute(
        sa.text("SELECT id FROM users WHERE email = :email"),
        {"email": DEFAULT_LOCAL_USER_EMAIL},
    ).first()
    if existing_user is None:
        bind.execute(
            sa.text(
                """
                INSERT INTO users (id, email, password_hash, display_name, subscription_status, subscription_plan)
                VALUES (:id, :email, :password_hash, :display_name, 'inactive', 'free')
                """
            ),
            {
                "id": DEFAULT_LOCAL_USER_ID,
                "email": DEFAULT_LOCAL_USER_EMAIL,
                "password_hash": "local-backfill-password-reset-required",
                "display_name": "Local Operator",
            },
        )

    for table_name in OWNED_TABLES:
        op.add_column(table_name, sa.Column("user_id", sa.String(length=36), nullable=True))
        op.create_index(f"ix_{table_name}_user_id", table_name, ["user_id"])
        op.execute(sa.text(f"UPDATE {table_name} SET user_id = :user_id WHERE user_id IS NULL").bindparams(user_id=DEFAULT_LOCAL_USER_ID))
        op.alter_column(table_name, "user_id", existing_type=sa.String(length=36), nullable=False)
        op.create_foreign_key(f"fk_{table_name}_user_id_users", table_name, "users", ["user_id"], ["id"])

    op.add_column("keyword_sets", sa.Column("user_id", sa.String(length=36), nullable=True))
    op.create_index("ix_keyword_sets_user_id", "keyword_sets", ["user_id"])
    op.execute(sa.text("UPDATE keyword_sets SET user_id = :user_id WHERE user_id IS NULL").bindparams(user_id=DEFAULT_LOCAL_USER_ID))
    op.create_foreign_key("fk_keyword_sets_user_id_users", "keyword_sets", "users", ["user_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_keyword_sets_user_id_users", "keyword_sets", type_="foreignkey")
    op.drop_index("ix_keyword_sets_user_id", table_name="keyword_sets")
    op.drop_column("keyword_sets", "user_id")

    for table_name in reversed(OWNED_TABLES):
        op.drop_constraint(f"fk_{table_name}_user_id_users", table_name, type_="foreignkey")
        op.drop_index(f"ix_{table_name}_user_id", table_name=table_name)
        op.drop_column(table_name, "user_id")

    op.drop_index("ix_password_reset_requests_token_hash", table_name="password_reset_requests")
    op.drop_index("ix_password_reset_requests_user_id", table_name="password_reset_requests")
    op.drop_table("password_reset_requests")
    op.drop_index("ix_auth_sessions_token_hash", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
