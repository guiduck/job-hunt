from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.email import EmailDraft, OutreachEvent, SendRequest


def test_linkedin_jobs_external_creates_no_outreach_records(client: TestClient, auth_headers: dict[str, str], db_session: Session) -> None:
    run = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"selected_source_keys": ["ashby"], "max_pages": 1},
    )
    assert run.status_code == 202, run.text
    run_id = run.json()["id"]

    candidate = client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/candidates",
        headers=auth_headers,
        json={
            "linkedin_job_url": "https://www.linkedin.com/jobs/view/123",
            "job_title": "Backend Engineer",
            "company_name": "No Outreach Co",
            "apply_button_kind": "external",
            "decoded_apply_url": "https://jobs.ashbyhq.com/no-outreach/backend",
            "canonical_apply_url": "https://jobs.ashbyhq.com/no-outreach/backend",
            "source_key": "ashby",
            "outcome": "accepted",
            "page_number": 1,
        },
    )

    assert candidate.status_code == 200, candidate.text
    assert db_session.scalar(select(func.count()).select_from(EmailDraft)) == 0
    assert db_session.scalar(select(func.count()).select_from(SendRequest)) == 0
    assert db_session.scalar(select(func.count()).select_from(OutreachEvent)) == 0