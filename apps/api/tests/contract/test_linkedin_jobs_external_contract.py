from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.models.job_search_run import JobSearchRun, JobSearchRunStatus
from fastapi.testclient import TestClient


def create_run(client: TestClient, auth_headers: dict[str, str]) -> dict[str, object]:
    response = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={
            "search_text": "typescript remote backend",
            "search_mode": "classic_keywords",
            "query_terms": ["typescript", "remote", "backend"],
            "date_posted": "past_week",
            "sort": "most_recent",
            "selected_source_keys": ["ashby", "lever"],
            "max_pages": 1,
        },
    )
    assert response.status_code == 202, response.text
    return response.json()


def test_linkedin_jobs_external_run_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    body = create_run(client, auth_headers)

    assert body["search_kind"] == "linkedin_jobs_external"
    assert body["status"] == "pending"
    assert body["selected_source_keys"] == ["ashby", "lever"]
    assert body["inspected_cap"] == 1
    assert body["provider_metadata"]["search_mode"] == "classic_keywords"
    assert body["provider_metadata"]["date_posted"] == "past_week"


def test_linkedin_jobs_external_validates_max_pages_and_sources(client: TestClient, auth_headers: dict[str, str]) -> None:
    too_many_pages = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"max_pages": 31, "selected_source_keys": ["ashby"]},
    )
    unknown_source = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"selected_source_keys": ["micro1"]},
    )

    assert too_many_pages.status_code == 422
    assert unknown_source.status_code == 409


def test_linkedin_jobs_external_candidate_pipeline(client: TestClient, auth_headers: dict[str, str]) -> None:
    run = create_run(client, auth_headers)
    run_id = run["id"]

    progress = client.patch(
        f"/job-search-runs/linkedin-jobs-external/{run_id}",
        headers=auth_headers,
        json={"status": "running", "navigation_method": "direct_url", "pages_visited": 1, "jobs_inspected": 1},
    )
    candidate = client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/candidates",
        headers=auth_headers,
        json={
            "linkedin_job_url": "https://www.linkedin.com/jobs/view/123",
            "job_title": "Senior Backend Engineer",
            "company_name": "Example Co",
            "location_text": "Brazil Remote",
            "apply_button_kind": "external",
            "raw_apply_href": "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc",
            "decoded_apply_url": "https://jobs.ashbyhq.com/example/abc",
            "canonical_apply_url": "https://jobs.ashbyhq.com/example/abc",
            "source_key": "ashby",
            "outcome": "accepted",
            "page_number": 1,
            "position_on_page": 1,
        },
    )
    duplicate = client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/candidates",
        headers=auth_headers,
        json={
            "linkedin_job_url": "https://www.linkedin.com/jobs/view/123",
            "job_title": "Senior Backend Engineer",
            "company_name": "Example Co",
            "apply_button_kind": "external",
            "decoded_apply_url": "https://jobs.ashbyhq.com/example/abc",
            "canonical_apply_url": "https://jobs.ashbyhq.com/example/abc",
            "source_key": "ashby",
            "outcome": "accepted",
            "page_number": 1,
            "position_on_page": 2,
        },
    )
    skipped = client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/candidates",
        headers=auth_headers,
        json={
            "linkedin_job_url": "https://www.linkedin.com/jobs/view/456",
            "job_title": "Frontend Engineer",
            "company_name": "Easy Co",
            "apply_button_kind": "easy_apply",
            "outcome": "skipped_easy_apply",
            "skip_reason": "Easy Apply is intentionally skipped.",
            "page_number": 1,
        },
    )
    complete = client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/complete",
        headers=auth_headers,
        json={
            "status": "completed",
            "terminal_reason": "max_pages_reached",
            "pages_visited": 1,
            "jobs_inspected": 3,
            "external_links_found": 2,
            "accepted": 1,
            "skipped_easy_apply": 1,
            "unsupported_source": 0,
            "duplicates": 1,
            "failures": 0,
            "navigation_method": "direct_url",
        },
    )
    opportunities = client.get(f"/job-search-runs/{run_id}/opportunities", headers=auth_headers)

    assert progress.status_code == 200, progress.text
    assert candidate.status_code == 200, candidate.text
    assert candidate.json()["outcome"] == "accepted"
    assert candidate.json()["opportunity_id"]
    assert duplicate.status_code == 200, duplicate.text
    assert duplicate.json()["outcome"] == "duplicate"
    assert duplicate.json()["duplicate_of_opportunity_id"] == candidate.json()["opportunity_id"]
    assert skipped.status_code == 200, skipped.text
    assert skipped.json()["outcome"] == "skipped_easy_apply"
    assert complete.status_code == 200, complete.text
    assert complete.json()["status"] == "completed"
    assert opportunities.status_code == 200
    assert len(opportunities.json()) == 1
    assert opportunities.json()[0]["job_detail"]["job_application_kind"] == "external_application"

def test_linkedin_jobs_external_stale_browser_run_is_recovered(client: TestClient, auth_headers: dict[str, str], db_session) -> None:
    first = create_run(client, auth_headers)
    blocked = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"selected_source_keys": ["ashby"], "max_pages": 1},
    )
    assert blocked.status_code == 409

    old_run = db_session.scalar(select(JobSearchRun).where(JobSearchRun.id == first["id"]))
    assert old_run is not None
    stale_at = datetime.now(UTC) - timedelta(minutes=6)
    old_run.status = JobSearchRunStatus.RUNNING.value
    old_run.updated_at = stale_at
    old_run.started_at = stale_at
    db_session.commit()

    recovered = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"selected_source_keys": ["ashby"], "max_pages": 1},
    )
    db_session.refresh(old_run)

    assert recovered.status_code == 202, recovered.text
    assert recovered.json()["id"] != first["id"]
    assert old_run.status == JobSearchRunStatus.FAILED.value
    assert old_run.provider_error_code == "stale_browser_capture"