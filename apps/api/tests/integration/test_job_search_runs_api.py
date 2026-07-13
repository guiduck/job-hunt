from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.job_search_run import JobSearchKind, JobSearchRun, JobSearchRunStatus
from app.models.user import User


def test_start_status_candidates_and_opportunities_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    assert created.status_code == 202
    run_id = created.json()["id"]

    status_response = client.get(f"/job-search-runs/{run_id}", headers=auth_headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "pending"

    candidates = client.get(f"/job-search-runs/{run_id}/candidates", headers=auth_headers)
    assert candidates.status_code == 200
    assert candidates.json() == []

    opportunities = client.get(f"/job-search-runs/{run_id}/opportunities", headers=auth_headers)
    assert opportunities.status_code == 200
    assert opportunities.json() == []


def test_linkedin_search_history_excludes_career_page_and_keeps_unknown_raw_counts(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    test_user: User,
) -> None:
    first = client.post(
        "/job-search-runs",
        json={
            "keywords": ["python", "ai"],
            "search_query": "python ai",
            "raw_linkedin_result_count": 12,
            "raw_linkedin_result_count_source": "extension_content_script",
            "collection_source_types": ["authenticated_browser_search"],
            "collection_inputs": [],
        },
        headers=auth_headers,
    )
    second = client.post(
        "/job-search-runs",
        json={
            "keywords": ["python", "react"],
            "search_query": "react python",
            "collection_source_types": ["authenticated_browser_search"],
            "collection_inputs": [],
        },
        headers=auth_headers,
    )
    assert first.status_code == 202
    assert second.status_code == 202

    db_session.add(
        JobSearchRun(
            user_id=test_user.id,
            search_kind=JobSearchKind.CAREER_PAGE.value,
            status=JobSearchRunStatus.COMPLETED.value,
            requested_keywords=["python"],
            search_query="python",
            raw_linkedin_result_count=999,
            source_name="Career pages",
        )
    )
    db_session.commit()

    response = client.get("/job-search-runs/linkedin/history", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body["runs"]) == 2
    assert {run["search_query"] for run in body["runs"]} == {"python ai", "react python"}
    assert all(run["raw_linkedin_result_count"] != 999 for run in body["runs"])

    python_keyword = next(item for item in body["keyword_aggregates"] if item["value"] == "python")
    assert python_keyword["run_count"] == 2
    assert python_keyword["total_raw_linkedin_results"] == 12
    assert python_keyword["average_raw_linkedin_results"] == 12.0

    react_query = next(item for item in body["query_aggregates"] if item["value"] == "react python")
    assert react_query["total_raw_linkedin_results"] is None
    assert react_query["average_raw_linkedin_results"] is None