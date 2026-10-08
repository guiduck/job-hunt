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
