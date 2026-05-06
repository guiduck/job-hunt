from fastapi.testclient import TestClient


def test_create_run_without_ai_filter_settings_uses_safe_defaults(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/job-search-runs",
        json={"search_query": "hiring typescript", "search_sort_order": "recent", "candidate_limit": 50},
        headers=auth_headers,
    )

    assert response.status_code == 202
    body = response.json()
    assert body["search_query"] == "hiring typescript"
    assert body["search_sort_order"] == "recent"
    assert body["ai_filters_enabled"] is False
    assert body["ai_filter_settings"] == {
        "remote_only": False,
        "exclude_onsite": False,
        "accepted_regions": [],
        "excluded_regions": [],
    }
    assert body["ai_filter_status"] == "skipped"


def test_create_run_with_enabled_ai_filters_returns_additive_fields(
    client: TestClient,
    auth_headers: dict[str, str],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["typescript"],
            "search_query": "hiring typescript",
            "search_sort_order": "relevant",
            "collection_source_types": ["authenticated_browser_search"],
            "ai_filters_enabled": True,
            "ai_filter_settings": ai_filter_settings_payload,
        },
        headers=auth_headers,
    )

    assert response.status_code == 202
    body = response.json()
    assert body["ai_filters_enabled"] is True
    assert body["ai_filter_settings"]["remote_only"] is True
    assert body["ai_filter_settings"]["excluded_regions"] == ["India"]
