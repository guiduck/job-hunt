from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, record_candidate


def test_run_candidates_endpoint_exposes_candidate_outcomes(client: TestClient, db_session: Session) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))
    record_candidate(
        db_session,
        run,
        {
            "role_title": "TypeScript Developer",
            "contact_channel_type": "email",
            "contact_channel_value": "jobs@example.com",
            "source_query": "hiring typescript",
            "source_evidence": "We're hiring a TypeScript developer. Email jobs@example.com",
            "matched_keywords": ["typescript"],
            "provider_status": "collected",
        },
    )

    response = client.get(f"/job-search-runs/{run.id}/candidates")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["outcome"] == "accepted"
    assert body[0]["provider_status"] == "collected"
    assert body[0]["matched_keywords"] == ["typescript"]
