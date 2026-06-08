from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.job_search_run import JobSearchRun, JobSearchRunStatus


def test_career_page_run_is_owner_scoped_and_fresh_after_terminal_completion(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    settings = get_settings()
    original_key = settings.serpapi_api_key
    settings.serpapi_api_key = "test-serpapi-key"
    try:
        first = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "frontend remoto", "selected_source_keys": ["ashby"]},
            headers=auth_headers,
        )
        assert first.status_code == 202
        run = db_session.get(JobSearchRun, first.json()["id"])
        assert run is not None
        run.status = JobSearchRunStatus.COMPLETED_NO_RESULTS.value
        db_session.commit()

        second = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "frontend remoto", "selected_source_keys": ["ashby"]},
            headers=auth_headers,
        )
    finally:
        settings.serpapi_api_key = original_key

    assert second.status_code == 202
    assert second.json()["id"] != first.json()["id"]
    runs = db_session.scalars(select(JobSearchRun).where(JobSearchRun.search_kind == "career_page")).all()
    assert len(runs) == 2
    assert {run.user_id for run in runs} == {runs[0].user_id}


def test_career_page_source_defaults_and_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    settings = get_settings()
    original_key = settings.serpapi_api_key
    settings.serpapi_api_key = "test-serpapi-key"
    try:
        defaulted = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "typescript remoto"},
            headers=auth_headers,
        )
        invalid = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "typescript remoto", "selected_source_keys": ["unknown"]},
            headers=auth_headers,
        )
    finally:
        settings.serpapi_api_key = original_key

    assert defaulted.status_code == 202
    assert defaulted.json()["selected_source_keys"] == [
        "inhire",
        "ashby",
        "lever",
        "greenhouse",
        "smartrecruiters",
        "trampos",
        "catho",
    ]
    assert invalid.status_code == 409
