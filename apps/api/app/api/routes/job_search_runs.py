from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.api.errors import bad_request, conflict, not_found
from app.db.session import get_db
from app.models.user import User
from app.schemas.job_search_run import CareerPageSearchRunCreate, CuratedCareerSource, CuratedExternalSourceResponse, JobSearchCandidate, JobSearchKind, JobSearchRun, JobSearchRunCreate, LinkedInJobsExternalCandidateCreate, LinkedInJobsExternalCandidateResult, LinkedInJobsExternalComplete, LinkedInJobsExternalProgressUpdate, LinkedInJobsExternalRunCreate, SearchHistoryResponse
from app.schemas.opportunity import Opportunity
from app.services.career_page_sources import list_curated_career_sources
from app.services.job_search_run_service import (
    complete_linkedin_jobs_external_run,
    create_career_page_search_run,
    create_linkedin_jobs_external_run,
    create_job_search_run,
    get_latest_job_search_run,
    get_job_search_run,
    get_linkedin_search_history,
    record_linkedin_jobs_external_candidate,
    list_candidates,
    list_job_search_runs,
    update_linkedin_jobs_external_run,
)
from app.services.opportunity_service import get_opportunity

router = APIRouter(prefix="/job-search-runs", tags=["job-search-runs"])


@router.get("/career-page/curated-sources", response_model=list[CuratedCareerSource])
def list_career_page_sources() -> list[CuratedCareerSource]:
    return list_curated_career_sources()


@router.post("/career-page", response_model=JobSearchRun, status_code=status.HTTP_202_ACCEPTED)
def start_career_page_search_run(
    payload: CareerPageSearchRunCreate | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchRun:
    try:
        return create_career_page_search_run(db, payload or CareerPageSearchRunCreate(), user=user)
    except ValueError as error:
        raise conflict(str(error)) from error
    except RuntimeError as error:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.get("/career-page/latest", response_model=JobSearchRun | None)
def get_latest_career_page_run(db: Session = Depends(get_db), user: User = Depends(current_user)) -> JobSearchRun | None:
    return get_latest_job_search_run(db, search_kind=JobSearchKind.CAREER_PAGE.value, user=user)



@router.get("/external-sources", response_model=CuratedExternalSourceResponse)
def list_external_sources() -> CuratedExternalSourceResponse:
    return CuratedExternalSourceResponse(sources=list_curated_career_sources())


@router.post("/linkedin-jobs-external", response_model=JobSearchRun, status_code=status.HTTP_202_ACCEPTED)
def start_linkedin_jobs_external_run(
    payload: LinkedInJobsExternalRunCreate | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchRun:
    try:
        return create_linkedin_jobs_external_run(db, payload or LinkedInJobsExternalRunCreate(), user=user)
    except ValueError as error:
        raise conflict(str(error)) from error


@router.get("/linkedin-jobs-external/latest", response_model=JobSearchRun | None)
def get_latest_linkedin_jobs_external_run(db: Session = Depends(get_db), user: User = Depends(current_user)) -> JobSearchRun | None:
    return get_latest_job_search_run(db, search_kind=JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value, user=user)


@router.patch("/linkedin-jobs-external/{run_id}", response_model=JobSearchRun)
def update_linkedin_jobs_external_progress(
    run_id: str,
    payload: LinkedInJobsExternalProgressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchRun:
    run = get_job_search_run(db, run_id, user=user)
    if run is None:
        raise not_found("Job search run not found")
    try:
        return update_linkedin_jobs_external_run(db, run, payload)
    except ValueError as error:
        raise bad_request(str(error)) from error


@router.post("/linkedin-jobs-external/{run_id}/candidates", response_model=LinkedInJobsExternalCandidateResult)
def submit_linkedin_jobs_external_candidate(
    run_id: str,
    payload: LinkedInJobsExternalCandidateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> LinkedInJobsExternalCandidateResult:
    run = get_job_search_run(db, run_id, user=user)
    if run is None:
        raise not_found("Job search run not found")
    try:
        return record_linkedin_jobs_external_candidate(db, run, payload)
    except ValueError as error:
        raise bad_request(str(error)) from error


@router.post("/linkedin-jobs-external/{run_id}/complete", response_model=JobSearchRun)
def complete_linkedin_jobs_external(
    run_id: str,
    payload: LinkedInJobsExternalComplete,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchRun:
    run = get_job_search_run(db, run_id, user=user)
    if run is None:
        raise not_found("Job search run not found")
    try:
        return complete_linkedin_jobs_external_run(db, run, payload)
    except ValueError as error:
        raise bad_request(str(error)) from error

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
    ai_filter_status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[JobSearchRun]:
    return list_job_search_runs(db, status, limit, provider_status, analysis_status, ai_filter_status, user=user)



@router.get("/linkedin/history", response_model=SearchHistoryResponse)
def get_linkedin_history(
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=20),
    aggregate_limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> SearchHistoryResponse:
    return get_linkedin_search_history(db, limit=limit, aggregate_limit=aggregate_limit, status=status, q=q, user=user)

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
    ai_filter_status: str | None = Query(default=None),
    min_score: int | None = Query(default=None, ge=0, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[JobSearchCandidate]:
    if get_job_search_run(db, run_id, user=user) is None:
        raise not_found("Job search run not found")
    return list_candidates(db, run_id, outcome, collection_source_type, analysis_status, ai_filter_status, min_score, user=user)


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
