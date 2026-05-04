from sqlalchemy.orm import Session

from app.schemas.opportunity import OpportunityCreate
from app.services.opportunity_service import create_opportunity


def test_existing_accepted_job_gets_safe_review_defaults(
    db_session: Session,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = create_opportunity(db_session, OpportunityCreate.model_validate(review_ready_job_payload))

    assert opportunity.job_detail is not None
    assert opportunity.job_detail.review_status == "unreviewed"
    assert opportunity.job_detail.analysis_status == "deterministic_only"
    assert opportunity.job_detail.match_score is not None
    assert 0 <= opportunity.job_detail.match_score <= 100
    assert opportunity.job_detail.score_factors["matched_keywords"] == ["typescript", "reactjs", "nextjs"]
