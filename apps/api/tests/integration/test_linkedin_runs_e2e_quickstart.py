from fastapi.testclient import TestClient


def test_supplied_content_quickstart_create_flow(client: TestClient) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["typescript"],
            "collection_source_types": ["provided_public_content"],
            "collection_inputs": [
                {
                    "source_type": "provided_public_content",
                    "label": "manual-linkedin-post",
                    "provided_text": "We're hiring a TypeScript Developer. Email jobs@example.com",
                    "source_url": "https://www.linkedin.com/feed/update/example",
                }
            ],
            "candidate_limit": 50,
        },
    )

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "pending"
    assert body["requested_keywords"] == ["typescript"]
    assert body["collection_inputs"][0]["source_type"] == "provided_public_content"
    assert body["provider_status"] == "not_started"
