from app.services.job_review_scoring import build_review_profile, calculate_historical_similarity_signals


def test_historical_adjustment_is_included_in_worker_score(sample_review_candidate: dict[str, object]) -> None:
    positive = calculate_historical_similarity_signals(["saved", "interview"])
    neutral = calculate_historical_similarity_signals([])

    positive_profile = build_review_profile(sample_review_candidate, ["typescript"], historical_similarity_signals=positive)
    neutral_profile = build_review_profile(sample_review_candidate, ["typescript"], historical_similarity_signals=neutral)

    assert positive_profile["match_score"] > neutral_profile["match_score"]
    assert positive_profile["score_factors"]["historical_adjustment"] == 10
