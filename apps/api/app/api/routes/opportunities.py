from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.api.errors import not_found
from app.db.session import get_db
from app.models.user import User
from app.schemas.opportunity import (
    Opportunity,
    OpportunityBulkDeleteRequest,
    OpportunityBulkDeleteResponse,
    OpportunityCreate,
    OpportunityListItem,
    OpportunityUpdate,
)
from app.services.opportunity_service import (
    create_opportunity,
    delete_opportunities,
    delete_opportunity,
    get_opportunity,
    list_opportunities,
    update_opportunity,
)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.post("", response_model=Opportunity, status_code=status.HTTP_201_CREATED)
def create_opportunity_endpoint(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> Opportunity:
    return create_opportunity(db, payload, user=user)


@router.get("", response_model=list[OpportunityListItem])
def list_opportunities_endpoint(
    opportunity_type: str | None = Query(default=None),
    contact_channel: str | None = Query(default=None),
    matched_keyword: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    min_score: int | None = Query(default=None, ge=0, le=100),
    contact_available: bool | None = Query(default=None),
    contact_channel_type: str | None = Query(default=None),
    job_stage: str | None = Query(default=None),
    review_status: str | None = Query(default=None),
    provider_status: str | None = Query(default=None),
    analysis_status: str | None = Query(default=None),
    send_status: str | None = Query(default=None, pattern="^(sent|unsent)$"),
    sort_order: str = Query(default="newest", pattern="^(newest|oldest)$"),
    source_query: str | None = Query(default=None),
    run_id: str | None = Query(default=None),
    campaign_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[OpportunityListItem]:
    return list_opportunities(
        db,
        opportunity_type=opportunity_type,
        contact_channel=contact_channel or contact_channel_type,
        matched_keyword=matched_keyword or keyword,
        min_score=min_score,
        contact_available=contact_available,
        job_stage=job_stage,
        review_status=review_status,
        provider_status=provider_status,
        analysis_status=analysis_status,
        send_status=send_status,
        sort_order=sort_order,
        source_query=source_query,
        run_id=run_id,
        campaign_id=campaign_id,
        user=user,
    )


@router.post("/bulk-delete", response_model=OpportunityBulkDeleteResponse)
def bulk_delete_opportunities_endpoint(
    payload: OpportunityBulkDeleteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> OpportunityBulkDeleteResponse:
    deleted_count = delete_opportunities(
        db,
        opportunity_ids=payload.opportunity_ids,
        send_status=payload.send_status,
        user=user,
    )
    return OpportunityBulkDeleteResponse(deleted_count=deleted_count)


@router.get("/{opportunity_id}", response_model=Opportunity)
def get_opportunity_endpoint(
    opportunity_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> Opportunity:
    opportunity = get_opportunity(db, opportunity_id, user=user)
    if opportunity is None:
        raise not_found("Opportunity not found")
    return opportunity


@router.patch("/{opportunity_id}", response_model=Opportunity)
def update_opportunity_endpoint(
    opportunity_id: str,
    payload: OpportunityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> Opportunity:
    opportunity = update_opportunity(db, opportunity_id, payload, user=user)
    if opportunity is None:
        raise not_found("Opportunity not found")
    return opportunity


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity_endpoint(
    opportunity_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> None:
    deleted = delete_opportunity(db, opportunity_id, user=user)
    if not deleted:
        raise not_found("Opportunity not found")
