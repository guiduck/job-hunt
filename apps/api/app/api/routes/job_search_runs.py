from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.api.errors import not_found
from app.db.session import get_db
from app.models.user import User
from app.schemas.job_search_run import JobSearchCandidate, JobSearchRun, JobSearchRunCreate
from app.schemas.opportunity import Opportunity
from app.services.job_search_run_service import (
    create_job_search_run,
    get_job_search_run,
    list_candidates,
    list_job_search_runs,
)
from app.services.opportunity_service import get_opportunity

router = APIRouter(prefix="/job-search-runs", tags=["job-search-runs"])


@router.post("", response_model=JobSearchRun, status_code=status.HTTP_202_ACCEPTED)
def start_job_search_run(
    payload: JobSearchRunCreate | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchRun:
    return create_job_search_run(db, payload or JobSearchRunCreate(), user=user)


@router.get("", response_model=list[JobSearchRun])
def list_runs(
    status: str | None = Query(default=None),
    provider_status: str | None = Query(default=None),
    analysis_status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[JobSearchRun]:
    return list_job_search_runs(db, status, limit, provider_status, analysis_status, user=user)


@router.get("/{run_id}", response_model=JobSearchRun)
def get_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)) -> JobSearchRun:
    run = get_job_search_run(db, run_id, user=user)
    if run is None:
        raise not_found("Job search run not found")
    return run


@router.get("/{run_id}/candidates", response_model=list[JobSearchCandidate])
def get_run_candidates(
    run_id: str,
    outcome: str | None = Query(default=None),
    collection_source_type: str | None = Query(default=None),
    analysis_status: str | None = Query(default=None),
    min_score: int | None = Query(default=None, ge=0, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[JobSearchCandidate]:
    if get_job_search_run(db, run_id, user=user) is None:
        raise not_found("Job search run not found")
    return list_candidates(db, run_id, outcome, collection_source_type, analysis_status, min_score, user=user)


@router.get("/{run_id}/opportunities", response_model=list[Opportunity])
def get_run_opportunities(run_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[Opportunity]:
    if get_job_search_run(db, run_id, user=user) is None:
        raise not_found("Job search run not found")
    candidates = list_candidates(db, run_id, outcome="accepted", user=user)
    opportunities = []
    for candidate in candidates:
        if candidate.opportunity_id:
            opportunity = get_opportunity(db, candidate.opportunity_id, user=user)
            if opportunity is not None:
                opportunities.append(opportunity)
    return opportunities
