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
