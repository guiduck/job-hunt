from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_linkedin_run_creation_still_works_without_career_page_config(client: TestClient, auth_headers: dict[str, str]) -> None:
    settings = get_settings()
    original_key = settings.serpapi_api_key
    settings.serpapi_api_key = None
    try:
        response = client.post(
            "/job-search-runs",
            json={"search_query": "hiring typescript", "collection_source_types": ["authenticated_browser_search"]},
            headers=auth_headers,
        )
    finally:
        settings.serpapi_api_key = original_key

    assert response.status_code == 202
    body = response.json()
    assert body["search_kind"] == "linkedin"
    assert body["source_name"] == "LinkedIn"


def test_existing_support_routes_still_respond(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get("/sending/provider-account", headers=auth_headers).status_code == 200
    assert client.get("/field-assistant/activations", headers=auth_headers).status_code == 200
