from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_review_status_and_notes_update_preserves_analysis(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/opportunities", json=sample_payload(), headers=auth_headers)
    opportunity_id = created.json()["id"]
    original_review = created.json()["job_detail"]["review_profile"]

    response = client.patch(
        f"/opportunities/{opportunity_id}",
        json={"review_status": "saved", "operator_notes": "Worth applying this week."},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    review = body["job_detail"]["review_profile"]
    assert body["operator_notes"] == "Worth applying this week."
    assert review["review_status"] == "saved"
    assert review["match_score"] == original_review["match_score"]
    assert review["analysis_status"] == original_review["analysis_status"]
    assert body["source_evidence"] == "Email jobs@example.com with your resume."
