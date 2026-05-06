import pytest
from pydantic import ValidationError

from app.schemas.job_search_run import AIFilterSettings, JobSearchCandidate, JobSearchRunCreate


def test_ai_filters_default_disabled() -> None:
    payload = JobSearchRunCreate(search_query="hiring typescript")

    assert payload.ai_filters_enabled is False
    assert payload.ai_filter_settings == AIFilterSettings()
    assert payload.search_sort_order == "recent"


def test_ai_filter_settings_normalize_string_terms() -> None:
    settings = AIFilterSettings(accepted_regions="LATAM, Brazil\nPortugal", excluded_regions=["India", "India"])

    assert settings.accepted_regions == ["LATAM", "Brazil", "Portugal"]
    assert settings.excluded_regions == ["India"]


def test_candidate_ai_filter_confidence_bounds(ai_filter_candidate_payload: dict[str, object]) -> None:
    candidate = JobSearchCandidate(
        id="candidate-1",
        run_id="run-1",
        outcome="accepted",
        created_at="2026-05-05T00:00:00Z",
        **ai_filter_candidate_payload,
    )
    assert candidate.ai_filter_confidence == 0.91

    with pytest.raises(ValidationError):
        JobSearchCandidate(
            id="candidate-2",
            run_id="run-1",
            outcome="accepted",
            source_query="hiring typescript",
            matched_keywords=["typescript"],
            created_at="2026-05-05T00:00:00Z",
            ai_filter_confidence=1.2,
        )
