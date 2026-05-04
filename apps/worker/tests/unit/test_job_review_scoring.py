from app.services.job_review_scoring import build_review_profile


def test_deterministic_review_profile_scores_candidate(sample_review_candidate: dict[str, object]) -> None:
    profile = build_review_profile(sample_review_candidate, ["typescript", "reactjs", "python"])

    assert 0 <= profile["match_score"] <= 100
    assert profile["analysis_status"] == "deterministic_only"
    assert profile["review_status"] == "unreviewed"
    assert profile["missing_keywords"] == ["python"]
    assert "Matched 3 keyword" in profile["score_explanation"]


def test_review_profile_detects_job_context(sample_review_candidate: dict[str, object]) -> None:
    profile = build_review_profile(sample_review_candidate, ["typescript"])

    assert profile["normalized_company_name"] == "Example Co"
    assert profile["normalized_role_title"] == "Senior TypeScript Developer"
    assert profile["detected_seniority"] == "senior"
    assert profile["detected_modality"] == "remote"
