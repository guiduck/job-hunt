from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.api.errors import not_found
from app.db.session import get_db
from app.models.user import User
from app.schemas.job_search_preferences import JobSearchPreferenceRead, JobSearchPreferenceUpdate
from app.services.job_search_preferences_service import (
    delete_saved_search_keyword,
    read_job_search_preference,
    update_job_search_preference,
)

router = APIRouter(prefix="/job-search-preferences", tags=["job-search-preferences"])


@router.get("", response_model=JobSearchPreferenceRead)
def get_search_preference(
    opportunity_type: str = Query(default="job", pattern="^job$"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchPreferenceRead:
    return read_job_search_preference(db, user)


@router.put("", response_model=JobSearchPreferenceRead)
def put_search_preference(
    payload: JobSearchPreferenceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchPreferenceRead:
    return update_job_search_preference(db, payload, user)


@router.delete("/keywords/{keyword}", response_model=JobSearchPreferenceRead)
def delete_search_keyword(
    keyword: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> JobSearchPreferenceRead:
    preference = delete_saved_search_keyword(db, keyword, user)
    if preference is None:
        raise not_found("Saved keyword not found")
    return preference
