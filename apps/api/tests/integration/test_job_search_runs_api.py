from fastapi.testclient import TestClient
from sqlalchemy import event
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


def test_lightweight_run_queries_do_not_select_heavy_payload_columns(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    created = client.post(
        "/job-search-runs",
        json={
            "keywords": ["python", "react"],
            "search_query": "python react",
            "collection_source_types": ["provided_public_content"],
            "collection_inputs": [
                {
                    "source_type": "provided_public_content",
                    "provided_text": "large source evidence " * 500,
                }
            ],
        },
        headers=auth_headers,
    )
    assert created.status_code == 202

    statements: list[str] = []

    def capture_sql(_connection, _cursor, statement, _parameters, _context, _executemany) -> None:
        statements.append(statement)

    event.listen(db_session.bind, "before_cursor_execute", capture_sql)
    try:
        count_response = client.get("/job-search-runs/count", headers=auth_headers)
        summary_response = client.get("/job-search-runs/summaries", headers=auth_headers)
        history_response = client.get("/job-search-runs/linkedin/history?limit=1&q=react", headers=auth_headers)
    finally:
        event.remove(db_session.bind, "before_cursor_execute", capture_sql)

    assert count_response.json() == {"count": 1}
    assert len(summary_response.json()) == 1
    assert len(history_response.json()["runs"]) == 1

    run_queries = [statement for statement in statements if "FROM job_search_runs" in statement]
    assert run_queries
    assert any("count(job_search_runs.id)" in statement.lower() for statement in run_queries)
    assert any("LIMIT" in statement for statement in run_queries)
    assert all("source_diagnostics" not in statement for statement in run_queries)
    assert all("provider_metadata" not in statement for statement in run_queries)
    assert all("provided_text" not in statement for statement in run_queries)
    assert all("linkedin_collection_inputs" not in statement for statement in run_queries)
