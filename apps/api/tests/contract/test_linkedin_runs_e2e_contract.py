from pathlib import Path

from fastapi.testclient import TestClient


CONTRACT = Path(__file__).resolve().parents[4] / "specs" / "004-linkedin-runs-e2e" / "contracts" / "openapi.yaml"


def test_create_and_get_run_include_contract_lifecycle_fields(client: TestClient) -> None:
    response = client.post(
        "/job-search-runs",
        json={
            "keywords": ["typescript"],
            "collection_source_types": ["provided_public_content"],
            "collection_inputs": [
                {
                    "source_type": "provided_public_content",
                    "provided_text": "We're hiring a TypeScript developer. Email jobs@example.com",
                    "label": "manual-linkedin-post",
                }
            ],
        },
    )

    assert response.status_code == 202
    body = response.json()
    for field in [
        "id",
        "status",
        "requested_keywords",
        "collection_inputs",
        "provider_status",
        "provider_error_code",
        "started_at",
        "completed_at",
        "created_at",
        "updated_at",
    ]:
        assert field in body

    detail = client.get(f"/job-search-runs/{body['id']}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "pending"


def test_contract_mentions_stale_failure_and_candidate_visibility() -> None:
    contract_text = CONTRACT.read_text(encoding="utf-8")

    assert "/job-search-runs/{run_id}/candidates" in contract_text
    assert "stale_running" in contract_text
    assert "collection_inputs" in contract_text
