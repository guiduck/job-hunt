from app.services.job_review_scoring import calculate_historical_similarity_signals


def test_historical_similarity_adjusts_for_positive_and_negative_outcomes() -> None:
    signals = calculate_historical_similarity_signals(["saved", "responded", "interview", "rejected", "ignored"])

    assert signals["comparable_count"] == 5
    assert signals["positive_outcome_count"] == 3
    assert signals["negative_outcome_count"] == 2
    assert signals["adjustment"] == 5
