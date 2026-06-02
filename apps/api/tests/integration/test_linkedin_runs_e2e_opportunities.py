from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, record_candidate


def test_run_scoped_and_global_job_opportunity_visibility(
    client: TestClient,
    db_session: Session,
    auth_headers: dict[str, str],
    test_user: User,
) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]), user=test_user)
    record_candidate(
        db_session,
        run,
        {
            "company_name": "Example Co",
            "role_title": "TypeScript Developer",
            "contact_channel_type": "email",
            "contact_channel_value": "jobs@example.com",
            "source_query": "hiring typescript",
            "source_evidence": (
                "Publicacao no feed Alice Recruiter - "
                "We're hiring a TypeScript developer. Email jobs@example.com"
            ),
            "matched_keywords": ["typescript"],
            "provider_status": "collected",
            "collection_source_type": "provided_public_content",
        },
    )

    run_scoped = client.get(f"/job-search-runs/{run.id}/opportunities", headers=auth_headers)
    global_jobs = client.get("/opportunities?opportunity_type=job", headers=auth_headers)

    assert run_scoped.status_code == 200
    assert run_scoped.json()[0]["opportunity_type"] == "job"
    assert run_scoped.json()[0]["title"] == "Alice Recruiter"
    assert run_scoped.json()[0]["job_detail"]["contact_channel_value"] == "jobs@example.com"
    assert global_jobs.status_code == 200
    assert global_jobs.json()[0]["opportunity_type"] == "job"
    assert global_jobs.json()[0]["title"] == "Alice Recruiter"
