from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session


def default_review_profile(
    *,
    matched_keywords: list[str] | None = None,
    analysis_status: str = "deterministic_only",
) -> dict[str, object]:
    keywords = matched_keywords or []
    score = min(100, 20 + len(keywords) * 12)
    return {
        "review_status": "unreviewed",
        "match_score": score,
        "score_explanation": "Deterministic review profile generated from existing opportunity data.",
        "score_factors": {
            "positive": [f"Matched keyword: {keyword}" for keyword in keywords],
            "negative": [],
            "matched_keywords": keywords,
            "missing_keywords": [],
            "evidence_refs": ["source_evidence"],
            "historical_adjustment": 0,
        },
        "analysis_status": analysis_status,
        "analysis_confidence": "low",
        "missing_keywords": [],
        "historical_similarity_signals": {"comparable_count": 0, "adjustment": 0},
    }


def normalize_json_object(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def normalize_json_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def calculate_historical_similarity_signals(outcomes: list[str]) -> dict[str, object]:
    positive = sum(1 for outcome in outcomes if outcome in {"saved", "responded", "interview"})
    negative = sum(1 for outcome in outcomes if outcome in {"rejected", "ignored"})
    comparable_count = positive + negative
    adjustment = max(-20, min(20, positive * 5 - negative * 5))
    return {
        "comparable_count": comparable_count,
        "positive_outcome_count": positive,
        "negative_outcome_count": negative,
        "adjustment": adjustment,
    }


def query_historical_similarity_signals(
    db: Session,
    *,
    normalized_role_title: str | None,
    matched_keywords: list[str],
) -> dict[str, object]:
    from app.models.opportunity import JobOpportunityDetail

    if not normalized_role_title and not matched_keywords:
        return calculate_historical_similarity_signals([])

    statement = select(JobOpportunityDetail)
    if normalized_role_title:
        statement = statement.where(JobOpportunityDetail.normalized_role_title == normalized_role_title)
    rows = list(db.scalars(statement))
    lower_keywords = {keyword.lower() for keyword in matched_keywords}
    outcomes = []
    for detail in rows:
        detail_keywords = {str(keyword).lower() for keyword in detail.matched_keywords}
        if lower_keywords and not lower_keywords.intersection(detail_keywords):
            continue
        outcomes.append(detail.review_status)
        if detail.job_stage:
            outcomes.append(detail.job_stage)
    return calculate_historical_similarity_signals(outcomes)
