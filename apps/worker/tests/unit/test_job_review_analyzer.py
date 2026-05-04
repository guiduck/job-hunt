from app.services.job_review_analyzer import analyze_candidate


def test_analyzer_uses_deterministic_only_when_ai_disabled(sample_review_candidate: dict[str, object]) -> None:
    result = analyze_candidate(sample_review_candidate, ["typescript"], ai_enabled=False)

    assert result.status == "deterministic_only"
    assert result.review_profile["analysis_status"] == "deterministic_only"
    assert result.review_profile["match_score"] is not None


def test_analyzer_falls_back_when_ai_enabled_without_provider(sample_review_candidate: dict[str, object]) -> None:
    result = analyze_candidate(sample_review_candidate, ["typescript"], ai_enabled=True)

    assert result.status == "fallback"
    assert result.review_profile["analysis_status"] == "fallback"
    assert result.review_profile["analysis_error_code"] == "ai_not_configured"


def test_analyzer_accepts_valid_structured_ai_output(sample_review_candidate: dict[str, object]) -> None:
    result = analyze_candidate(
        sample_review_candidate,
        ["typescript"],
        ai_enabled=True,
        ai_provider=lambda _: {"match_score": 91, "score_explanation": "AI-assisted structured score."},
    )

    assert result.status == "ai_assisted"
    assert result.review_profile["analysis_status"] == "ai_assisted"
    assert result.review_profile["match_score"] == 91


def test_analyzer_falls_back_on_invalid_ai_output(sample_review_candidate: dict[str, object]) -> None:
    result = analyze_candidate(
        sample_review_candidate,
        ["typescript"],
        ai_enabled=True,
        ai_provider=lambda _: {"match_score": 101},
    )

    assert result.status == "fallback"
    assert result.review_profile["analysis_error_code"] == "invalid_ai_output"


def test_analyzer_falls_back_on_timeout(sample_review_candidate: dict[str, object]) -> None:
    def timeout_provider(_: dict[str, object]) -> dict[str, object]:
        raise TimeoutError

    result = analyze_candidate(sample_review_candidate, ["typescript"], ai_enabled=True, ai_provider=timeout_provider)

    assert result.status == "fallback"
    assert result.review_profile["analysis_error_code"] == "ai_timeout"
