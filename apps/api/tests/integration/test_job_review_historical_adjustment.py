from sqlalchemy.orm import Session

from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate
from app.services.job_review_scoring import query_historical_similarity_signals
from app.services.opportunity_service import create_opportunity, update_opportunity

from tests.integration.test_job_review_filters import make_payload


def test_historical_query_uses_review_and_job_stage_outcomes(db_session: Session) -> None:
    saved = create_opportunity(
        db_session,
        OpportunityCreate.model_validate(make_payload("Senior TypeScript Developer", "saved@example.com", ["typescript"], 80)),
    )
    update_opportunity(db_session, saved.id, OpportunityUpdate(review_status="saved"))

    rejected = create_opportunity(
        db_session,
        OpportunityCreate.model_validate(make_payload("Senior TypeScript Engineer", "rejected@example.com", ["typescript"], 70)),
    )
    update_opportunity(db_session, rejected.id, OpportunityUpdate(job_stage="rejected", review_status="ignored"))

    signals = query_historical_similarity_signals(
        db_session,
        normalized_role_title="Senior TypeScript Developer",
        matched_keywords=["typescript"],
    )

    assert signals["comparable_count"] >= 1
    assert "adjustment" in signals
