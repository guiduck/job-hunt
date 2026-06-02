"""use LinkedIn poster names as job opportunity titles

Revision ID: 019_linkedin_poster_titles
Revises: 018_job_search_preferences
Create Date: 2026-06-02
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import text

revision: str = "019_linkedin_poster_titles"
down_revision: str | None = "018_job_search_preferences"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(
        text(
            """
            SELECT id, source_evidence
            FROM opportunities
            WHERE opportunity_type = 'job'
              AND source_name = 'LinkedIn'
              AND source_evidence IS NOT NULL
            """
        )
    ).mappings()
    for row in rows:
        poster_name = extract_poster_name(str(row["source_evidence"] or ""))
        if not poster_name:
            continue
        connection.execute(
            text("UPDATE opportunities SET title = :title WHERE id = :id"),
            {"id": row["id"], "title": poster_name[:500]},
        )


def downgrade() -> None:
    pass


def extract_poster_name(source_evidence: str) -> str:
    prefixes = ("Publicação no feed ", "Publicacao no feed ", "PublicaÃ§Ã£o no feed ")
    for prefix in prefixes:
        if not source_evidence.startswith(prefix):
            continue
        remainder = source_evidence[len(prefix) :]
        if " - " in remainder:
            remainder = remainder.split(" - ", 1)[0]
            return dedupe_repeated_name(remainder.strip().rstrip("."))
        for separator in (" •", " â€¢"):
            if separator in remainder:
                remainder = remainder.split(separator, 1)[0]
                break
        else:
            parts = remainder.split()
            digit_index = next((index for index, part in enumerate(parts) if part[:1].isdigit()), None)
            remainder = " ".join(parts[:digit_index]) if digit_index is not None else remainder
        return dedupe_repeated_name(remainder.strip().rstrip("."))
    return ""


def dedupe_repeated_name(name: str) -> str:
    compact = name.strip()
    if len(compact) % 2 == 0:
        midpoint = len(compact) // 2
        first_half = compact[:midpoint]
        second_half = compact[midpoint:]
        if first_half.lower() == second_half.lower():
            return first_half.strip()

    parts = [part for part in name.split() if part]
    if len(parts) % 2 != 0:
        return name

    midpoint = len(parts) // 2
    first_half = " ".join(parts[:midpoint])
    second_half = " ".join(parts[midpoint:])
    return first_half if first_half == second_half else name
