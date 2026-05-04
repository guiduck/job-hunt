from fastapi.testclient import TestClient


def test_start_run_accepts_provider_fields(client: TestClient) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["typescript"],
            "hiring_intent_terms": ["hiring", "contratando"],
            "collection_source_types": ["provided_public_content"],
            "collection_inputs": [
                {
                    "source_type": "provided_public_content",
                    "label": "manual-post",
                    "provided_text": "Estamos contratando TypeScript Developer",
                }
            ],
            "candidate_limit": 50,
        },
    )

    assert response.status_code == 202
    body = response.json()
    assert body["hiring_intent_terms"] == ["hiring", "contratando"]
    assert body["collection_source_types"] == ["provided_public_content"]
    assert body["provided_source_count"] == 1
    assert body["provider_status"] == "not_started"
