from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_list_curated_sources_contract(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/job-search/curated-sources", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert {source["key"] for source in body} >= {"inhire", "ashby", "lever", "greenhouse"}
    assert all({"key", "name", "domain", "active", "search_hint"} <= set(source) for source in body)


def test_create_career_page_run_requires_provider_config(client: TestClient, auth_headers: dict[str, str]) -> None:
    settings = get_settings()
    original_key = settings.serpapi_api_key
    settings.serpapi_api_key = None
    try:
        response = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "react remoto", "selected_source_keys": ["ashby"]},
            headers=auth_headers,
        )
    finally:
        settings.serpapi_api_key = original_key

    assert response.status_code == 503


def test_create_career_page_run_contract_and_duplicate_guard(client: TestClient, auth_headers: dict[str, str]) -> None:
    settings = get_settings()
    original_key = settings.serpapi_api_key
    settings.serpapi_api_key = "test-serpapi-key"
    try:
        response = client.post(
            "/job-search-runs/career-page",
            json={
                "search_query": "react remoto",
                "selected_source_keys": ["ashby", "lever"],
                "accepted_limit": 7,
                "inspected_cap": 33,
            },
            headers=auth_headers,
        )
        duplicate = client.post(
            "/job-search-runs/career-page",
            json={"search_query": "react remoto", "selected_source_keys": ["ashby"]},
            headers=auth_headers,
        )
    finally:
        settings.serpapi_api_key = original_key

    assert response.status_code == 202
    body = response.json()
    assert body["search_kind"] == "career_page"
    assert body["status"] == "pending"
    assert body["selected_source_keys"] == ["ashby", "lever"]
    assert body["accepted_limit"] == 7
    assert body["inspected_cap"] == 33
    assert body["source_diagnostics"]["ashby"]["status"] == "pending"
    assert duplicate.status_code == 409


def test_mark_applied_contract_not_found(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch("/opportunities/missing/mark-applied", headers=auth_headers)

    assert response.status_code == 404
