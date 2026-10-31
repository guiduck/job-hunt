from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


def test_start_job_search_run_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "pending"
    assert body["candidate_limit"] == 50
    assert body["raw_linkedin_result_count"] is None
    assert body["raw_linkedin_result_count_source"] is None
    assert body["requested_keywords"] == ["reactjs", "typescript", "nextjs", "nodejs"]


def test_list_job_search_runs_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    response = client.get("/job-search-runs", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_job_search_runs_keeps_full_inputs_and_limit(
    client: TestClient, auth_headers: dict[str, str], db_session: Session
) -> None:
    first = client.post("/job-search-runs", json={"candidate_limit": 25}, headers=auth_headers)
    assert first.status_code == 202
    second = client.post(
        "/job-search-runs",
        json={
            "collection_source_types": ["authenticated_browser_search"],
            "collection_inputs": [
                {
                    "source_type": "authenticated_browser_search",
                    "provided_text": "Hiring a remote Python engineer",
                    "label": "Test post",
                }
            ],
        },
        headers=auth_headers,
    )
    assert second.status_code == 202

    statements: list[str] = []

    def capture_sql(_connection, _cursor, statement, _parameters, _context, _executemany) -> None:
        statements.append(statement)

    event.listen(db_session.bind, "before_cursor_execute", capture_sql)
    try:
        response = client.get("/job-search-runs?limit=2", headers=auth_headers)
        limited_response = client.get("/job-search-runs?limit=1", headers=auth_headers)
    finally:
        event.remove(db_session.bind, "before_cursor_execute", capture_sql)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    runs = response.json()
    assert len(runs) == 2
    assert len(limited_response.json()) == 1
    assert {run["id"] for run in runs} == {first.json()["id"], second.json()["id"]}
    detailed_run = next(run for run in runs if run["id"] == second.json()["id"])
    assert detailed_run["collection_inputs"][0]["provided_text"] == "Hiring a remote Python engineer"
    assert any("SELECT job_search_runs.id" in statement and "LIMIT" in statement for statement in statements)


def test_list_job_search_runs_is_owner_scoped(
    client: TestClient, auth_headers: dict[str, str], db_session: Session
) -> None:
    created = client.post("/job-search-runs", json={"candidate_limit": 25}, headers=auth_headers)
    assert created.status_code == 202
    other_user = create_user(db_session, email="other-runs@example.com", password="Password123!", display_name="Other")
    _, other_token = create_session(db_session, other_user)

    response = client.get("/job-search-runs", headers={"Authorization": f"Bearer {other_token}"})
    assert response.status_code == 200
    assert response.json() == []


def test_count_and_summary_job_search_runs_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/job-search-runs", json={"candidate_limit": 50}, headers=auth_headers)
    client.post("/job-search-runs", json={"candidate_limit": 25}, headers=auth_headers)

    count_response = client.get("/job-search-runs/count", headers=auth_headers)
    assert count_response.status_code == 200
    assert count_response.json() == {"count": 2}

    summary_response = client.get("/job-search-runs/summaries?limit=1", headers=auth_headers)
    assert summary_response.status_code == 200
    summaries = summary_response.json()
    assert len(summaries) == 1
    assert summaries[0]["status"] == "pending"
    assert "source_diagnostics" not in summaries[0]
    assert "provider_metadata" not in summaries[0]
    assert "collection_inputs" not in summaries[0]


def test_start_job_search_run_accepts_raw_linkedin_count(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["python", "ai"],
            "search_query": "python ai",
            "raw_linkedin_result_count": 17,
            "raw_linkedin_result_count_source": "extension_content_script",
            "collection_source_types": ["authenticated_browser_search"],
            "collection_inputs": [],
        },
        headers=auth_headers,
    )

    assert response.status_code == 202
    body = response.json()
    assert body["raw_linkedin_result_count"] == 17
    assert body["raw_linkedin_result_count_source"] == "extension_content_script"
