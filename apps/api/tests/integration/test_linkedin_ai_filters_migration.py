from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, get_job_search_run, record_candidate


def test_old_style_run_defaults_ai_filter_fields(db_session: Session) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))

    refreshed = get_job_search_run(db_session, run.id)

    assert refreshed is not None
    assert refreshed.ai_filters_enabled is False
    assert refreshed.ai_filter_settings == {}
    assert refreshed.ai_filter_status == "skipped"
    assert refreshed.ai_filter_inspected_count == 0


def test_old_style_candidate_defaults_ai_filter_fields(db_session: Session, ai_filter_candidate_payload: dict[str, object]) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))
    old_style_payload = {
        key: value
        for key, value in ai_filter_candidate_payload.items()
        if not key.startswith("ai_filter_") and key != "passes_ai_filter"
    }

    candidate = record_candidate(db_session, run, old_style_payload)

    assert candidate.ai_filter_status == "fallback"
    assert candidate.passes_ai_filter is None
    assert candidate.ai_filter_signals == {}


def test_old_style_run_serializes_ai_filter_defaults(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/job-search-runs", json={"keywords": ["typescript"]}, headers=auth_headers)

    assert response.status_code == 202
    body = response.json()
    assert body["ai_filters_enabled"] is False
    assert body["ai_filter_status"] == "skipped"
    assert body["ai_filter_inspected_count"] == 0
