import pytest
from pydantic import ValidationError

from app.schemas.job_search_run import CandidateAnalysisStatus, JobReviewProfile
from app.schemas.opportunity import JobReviewStatus, OpportunityUpdate


def test_review_profile_score_bounds() -> None:
    profile = JobReviewProfile(match_score=100, score_explanation="Strong match")

    assert profile.match_score == 100

    with pytest.raises(ValidationError):
        JobReviewProfile(match_score=101)


def test_review_status_values() -> None:
    assert JobReviewStatus.UNREVIEWED == "unreviewed"
    assert JobReviewStatus.REVIEWING == "reviewing"
    assert JobReviewStatus.SAVED == "saved"
    assert JobReviewStatus.IGNORED == "ignored"


def test_analysis_status_values() -> None:
    assert CandidateAnalysisStatus.DETERMINISTIC_ONLY == "deterministic_only"
    assert CandidateAnalysisStatus.AI_ASSISTED == "ai_assisted"
    assert CandidateAnalysisStatus.FALLBACK == "fallback"
    assert CandidateAnalysisStatus.FAILED == "failed"
    assert CandidateAnalysisStatus.SKIPPED == "skipped"


def test_opportunity_update_accepts_review_status() -> None:
    payload = OpportunityUpdate(review_status=JobReviewStatus.SAVED, operator_notes="Worth applying")

    assert payload.review_status == JobReviewStatus.SAVED
    assert payload.operator_notes == "Worth applying"
