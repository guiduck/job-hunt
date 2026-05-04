from fastapi.testclient import TestClient


def test_created_run_remains_pending_and_persists_collection_inputs(client: TestClient) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["typescript"],
            "collection_source_types": ["provided_public_content"],
            "collection_inputs": [
                {
                    "source_type": "provided_public_content",
                    "label": "manual-linkedin-post",
                    "provided_text": "We're hiring a TypeScript developer. Email jobs@example.com",
                    "source_url": "https://www.linkedin.com/feed/update/example",
                }
            ],
            "candidate_limit": 50,
        },
    )

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "pending"
    assert body["provider_status"] == "not_started"
    assert body["inspected_count"] == 0
    assert body["collection_inputs"][0]["label"] == "manual-linkedin-post"

    detail = client.get(f"/job-search-runs/{body['id']}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "pending"
