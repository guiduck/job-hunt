"""add sender contact context and clean recoverable email suffixes

Revision ID: 017_sender_profile_email_cleanup
Revises: 016_field_assistant_ctx
Create Date: 2026-05-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "017_sender_profile_email_cleanup"
down_revision: str | None = "016_field_assistant_ctx"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


EMAIL_RE = r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,63}$"


def upgrade() -> None:
    op.add_column("user_settings", sa.Column("operator_whatsapp", sa.String(length=64), nullable=True))
    op.add_column("user_settings", sa.Column("extra_context", sa.String(length=4000), nullable=True))

    _clean_hashtag_suffix("job_opportunity_details", "contact_email")
    _clean_hashtag_suffix("job_opportunity_details", "contact_channel_value", "contact_channel_type = 'email'")
    _clean_hashtag_suffix("email_drafts", "to_email")
    _clean_hashtag_suffix("send_requests", "recipient_email")
    _clean_hashtag_suffix("outreach_events", "recipient_email")


def downgrade() -> None:
    op.drop_column("user_settings", "extra_context")
    op.drop_column("user_settings", "operator_whatsapp")


def _clean_hashtag_suffix(table_name: str, column_name: str, extra_where: str | None = None) -> None:
    where_parts = [
        f"{column_name} IS NOT NULL",
        f"lower(trim({column_name})) ~ '(#?hashtag)[[:punct:][:space:]]*$'",
        f"regexp_replace(trim({column_name}), '(#?hashtag)[[:punct:][:space:]]*$', '', 'i') ~ :email_re",
    ]
    if extra_where:
        where_parts.append(extra_where)
    op.execute(
        sa.text(
            f"""
            UPDATE {table_name}
            SET {column_name} = lower(regexp_replace(trim({column_name}), '(#?hashtag)[[:punct:][:space:]]*$', '', 'i'))
            WHERE {" AND ".join(where_parts)}
            """
        ).bindparams(email_re=EMAIL_RE)
    )
