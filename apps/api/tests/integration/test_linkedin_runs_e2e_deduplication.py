from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, record_candidate


def test_duplicate_candidate_persists_without_duplicate_opportunity(db_session: Session) -> None:
    candidate = {
        "company_name": "Example Co",
        "role_title": "TypeScript Developer",
        "contact_channel_type": "email",
        "contact_channel_value": "jobs@example.com",
        "source_query": "hiring typescript",
        "source_evidence": "We're hiring a TypeScript developer. Email jobs@example.com",
        "matched_keywords": ["typescript"],
        "provider_status": "collected",
    }
    first_run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))
    second_run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))

    first = record_candidate(db_session, first_run, candidate)
    duplicate = record_candidate(db_session, second_run, candidate)

    assert first.outcome == "accepted"
    assert duplicate.outcome == "duplicate"
    assert duplicate.opportunity_id == first.opportunity_id
