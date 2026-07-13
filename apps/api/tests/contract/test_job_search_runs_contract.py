from fastapi.testclient import TestClient


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