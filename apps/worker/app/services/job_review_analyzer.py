from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.services.job_review_scoring import build_review_profile


@dataclass(frozen=True)
class AnalysisResult:
    review_profile: dict[str, object]
    status: str


def analyze_candidate(
    candidate: dict[str, object],
    requested_keywords: list[str] | None = None,
    *,
    ai_enabled: bool = False,
    ai_provider: Callable[[dict[str, object]], dict[str, object]] | None = None,
) -> AnalysisResult:
    """Analyze already-collected candidate text without fetching external sources."""
    if not ai_enabled:
        profile = build_review_profile(candidate, requested_keywords, analysis_status="deterministic_only")
        return AnalysisResult(review_profile=profile, status="deterministic_only")

    if ai_provider is not None:
        try:
            ai_output = ai_provider(candidate)
        except TimeoutError:
            profile = build_review_profile(
                candidate,
                requested_keywords,
                analysis_status="fallback",
                analysis_error_code="ai_timeout",
                analysis_error_message="AI analyzer timed out.",
            )
            return AnalysisResult(review_profile=profile, status="fallback")
        except Exception as exc:  # noqa: BLE001 - external analyzer failures should not block collection.
            profile = build_review_profile(
                candidate,
                requested_keywords,
                analysis_status="fallback",
                analysis_error_code="ai_unavailable",
                analysis_error_message=str(exc),
            )
            return AnalysisResult(review_profile=profile, status="fallback")

        validated = validate_ai_review_profile(ai_output)
        if validated is not None:
            deterministic = build_review_profile(candidate, requested_keywords, analysis_status="ai_assisted")
            profile = {**deterministic, **validated, "analysis_status": "ai_assisted"}
            return AnalysisResult(review_profile=profile, status="ai_assisted")

        profile = build_review_profile(
            candidate,
            requested_keywords,
            analysis_status="fallback",
            analysis_error_code="invalid_ai_output",
            analysis_error_message="AI analyzer returned incomplete or invalid structured output.",
        )
        return AnalysisResult(review_profile=profile, status="fallback")

    profile = build_review_profile(
        candidate,
        requested_keywords,
        analysis_status="fallback",
        analysis_error_code="ai_not_configured",
        analysis_error_message="AI analysis is enabled but no analyzer provider is configured.",
    )
    return AnalysisResult(review_profile=profile, status="fallback")


def validate_ai_review_profile(output: object) -> dict[str, object] | None:
    if not isinstance(output, dict):
        return None
    score = output.get("match_score")
    explanation = output.get("score_explanation")
    if not isinstance(score, int) or score < 0 or score > 100:
        return None
    if not isinstance(explanation, str) or not explanation.strip():
        return None
    return {
        "match_score": score,
        "score_explanation": explanation.strip(),
        "score_factors": output.get("score_factors") if isinstance(output.get("score_factors"), dict) else {},
        "analysis_confidence": output.get("analysis_confidence") if isinstance(output.get("analysis_confidence"), str) else "medium",
        "missing_keywords": output.get("missing_keywords") if isinstance(output.get("missing_keywords"), list) else [],
    }


def flatten_review_profile(candidate: dict[str, object], review_profile: dict[str, Any]) -> dict[str, object]:
    return {
        **candidate,
        "review_profile": review_profile,
        **review_profile,
    }
