"""job review intelligence fields

Revision ID: 005_job_review_intelligence
Revises: 004_linkedin_runs_e2e
Create Date: 2026-05-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "005_job_review_intelligence"
down_revision: str | None = "004_linkedin_runs_e2e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("job_search_runs", sa.Column("analysis_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("job_search_runs", sa.Column("analysis_status", sa.String(length=50), server_default="deterministic_only", nullable=False))
    op.add_column("job_search_runs", sa.Column("analysis_error_code", sa.String(length=100)))
    op.add_column("job_search_runs", sa.Column("analysis_error_message", sa.Text()))
    op.add_column("job_search_runs", sa.Column("deterministic_only_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("job_search_runs", sa.Column("ai_assisted_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("job_search_runs", sa.Column("analysis_fallback_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("job_search_runs", sa.Column("analysis_failed_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("job_search_runs", sa.Column("analysis_skipped_count", sa.Integer(), server_default="0", nullable=False))

    op.add_column("job_search_candidates", sa.Column("match_score", sa.Integer()))
    op.add_column("job_search_candidates", sa.Column("score_explanation", sa.Text()))
    op.add_column("job_search_candidates", sa.Column("score_factors", sa.JSON(), server_default="{}", nullable=False))
    op.add_column("job_search_candidates", sa.Column("analysis_status", sa.String(length=50), server_default="deterministic_only", nullable=False))
    op.add_column("job_search_candidates", sa.Column("analysis_confidence", sa.String(length=50)))
    op.add_column("job_search_candidates", sa.Column("analysis_error_code", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("analysis_error_message", sa.Text()))
    op.add_column("job_search_candidates", sa.Column("ai_model_name", sa.String(length=255)))
    op.add_column("job_search_candidates", sa.Column("ai_prompt_version", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("normalized_company_name", sa.String(length=255)))
    op.add_column("job_search_candidates", sa.Column("normalized_role_title", sa.String(length=500)))
    op.add_column("job_search_candidates", sa.Column("detected_seniority", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("detected_modality", sa.String(length=100)))
    op.add_column("job_search_candidates", sa.Column("detected_location", sa.String(length=255)))
    op.add_column("job_search_candidates", sa.Column("missing_keywords", sa.JSON(), server_default="[]", nullable=False))
    op.add_column("job_search_candidates", sa.Column("historical_similarity_signals", sa.JSON(), server_default="{}", nullable=False))

    op.add_column("job_opportunity_details", sa.Column("review_status", sa.String(length=50), server_default="unreviewed", nullable=False))
    op.add_column("job_opportunity_details", sa.Column("match_score", sa.Integer()))
    op.add_column("job_opportunity_details", sa.Column("score_explanation", sa.Text()))
    op.add_column("job_opportunity_details", sa.Column("score_factors", sa.JSON(), server_default="{}", nullable=False))
    op.add_column("job_opportunity_details", sa.Column("analysis_status", sa.String(length=50), server_default="deterministic_only", nullable=False))
    op.add_column("job_opportunity_details", sa.Column("analysis_confidence", sa.String(length=50)))
    op.add_column("job_opportunity_details", sa.Column("analysis_error_code", sa.String(length=100)))
    op.add_column("job_opportunity_details", sa.Column("analysis_error_message", sa.Text()))
    op.add_column("job_opportunity_details", sa.Column("normalized_company_name", sa.String(length=255)))
    op.add_column("job_opportunity_details", sa.Column("normalized_role_title", sa.String(length=500)))
    op.add_column("job_opportunity_details", sa.Column("detected_seniority", sa.String(length=100)))
    op.add_column("job_opportunity_details", sa.Column("detected_modality", sa.String(length=100)))
    op.add_column("job_opportunity_details", sa.Column("detected_location", sa.String(length=255)))
    op.add_column("job_opportunity_details", sa.Column("missing_keywords", sa.JSON(), server_default="[]", nullable=False))
    op.add_column("job_opportunity_details", sa.Column("historical_similarity_signals", sa.JSON(), server_default="{}", nullable=False))

    op.create_index("ix_job_search_runs_analysis_status", "job_search_runs", ["analysis_status"])
    op.create_index("ix_job_search_candidates_analysis_status", "job_search_candidates", ["analysis_status"])
    op.create_index("ix_job_search_candidates_match_score", "job_search_candidates", ["match_score"])
    op.create_index("ix_job_opportunity_details_review_status", "job_opportunity_details", ["review_status"])
    op.create_index("ix_job_opportunity_details_analysis_status", "job_opportunity_details", ["analysis_status"])
    op.create_index("ix_job_opportunity_details_match_score", "job_opportunity_details", ["match_score"])


def downgrade() -> None:
    op.drop_index("ix_job_opportunity_details_match_score", table_name="job_opportunity_details")
    op.drop_index("ix_job_opportunity_details_analysis_status", table_name="job_opportunity_details")
    op.drop_index("ix_job_opportunity_details_review_status", table_name="job_opportunity_details")
    op.drop_index("ix_job_search_candidates_match_score", table_name="job_search_candidates")
    op.drop_index("ix_job_search_candidates_analysis_status", table_name="job_search_candidates")
    op.drop_index("ix_job_search_runs_analysis_status", table_name="job_search_runs")

    for column_name in [
        "historical_similarity_signals",
        "missing_keywords",
        "detected_location",
        "detected_modality",
        "detected_seniority",
        "normalized_role_title",
        "normalized_company_name",
        "analysis_error_message",
        "analysis_error_code",
        "analysis_confidence",
        "analysis_status",
        "score_factors",
        "score_explanation",
        "match_score",
        "review_status",
    ]:
        op.drop_column("job_opportunity_details", column_name)

    for column_name in [
        "historical_similarity_signals",
        "missing_keywords",
        "detected_location",
        "detected_modality",
        "detected_seniority",
        "normalized_role_title",
        "normalized_company_name",
        "ai_prompt_version",
        "ai_model_name",
        "analysis_error_message",
        "analysis_error_code",
        "analysis_confidence",
        "analysis_status",
        "score_factors",
        "score_explanation",
        "match_score",
    ]:
        op.drop_column("job_search_candidates", column_name)

    for column_name in [
        "analysis_skipped_count",
        "analysis_failed_count",
        "analysis_fallback_count",
        "ai_assisted_count",
        "deterministic_only_count",
        "analysis_error_message",
        "analysis_error_code",
        "analysis_status",
        "analysis_enabled",
    ]:
        op.drop_column("job_search_runs", column_name)
