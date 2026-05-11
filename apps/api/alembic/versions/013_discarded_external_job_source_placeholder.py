"""preserve discarded external job source revision

Revision ID: 013_google_jobs_email_discovery
Revises: 012_linkedin_ai_filters
Create Date: 2026-05-08
"""

from collections.abc import Sequence

revision: str = "013_google_jobs_email_discovery"
down_revision: str | None = "012_linkedin_ai_filters"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Compatibility placeholder for local databases that already stamped this discarded spike."""


def downgrade() -> None:
    """No schema changes were retained for this discarded spike."""
