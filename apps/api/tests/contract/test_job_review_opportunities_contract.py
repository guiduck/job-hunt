from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_opportunity_contract_includes_review_profile(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/opportunities", json=sample_payload(), headers=auth_headers)

    assert created.status_code == 201
    body = created.json()
    review_profile = body["job_detail"]["review_profile"]
    assert review_profile["review_status"] == "unreviewed"
    assert isinstance(review_profile["match_score"], int)
    assert review_profile["analysis_status"] == "deterministic_only"
    assert "score_explanation" in review_profile


def test_opportunities_contract_returns_page_metadata(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/opportunities?opportunity_type=job&page=1&page_size=50", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["page"] == 1
    assert body["page_size"] == 50
    assert body["total_items"] == 0
    assert body["total_pages"] == 1
    assert body["has_next"] is False
    assert body["has_previous"] is False


def test_opportunities_contract_limits_page_size(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/opportunities?opportunity_type=job&page=1&page_size=101", headers=auth_headers)

    assert response.status_code == 422
