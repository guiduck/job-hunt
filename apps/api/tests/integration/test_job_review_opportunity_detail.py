from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_review_ready_detail_preserves_source_and_contact(client: TestClient) -> None:
    created = client.post("/opportunities", json=sample_payload())
    opportunity_id = created.json()["id"]

    response = client.get(f"/opportunities/{opportunity_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["source_query"] == "reactjs typescript email"
    assert body["source_evidence"] == "Email jobs@example.com with your resume."
    assert body["job_detail"]["contact_channel_value"] == "jobs@example.com"
    assert body["job_detail"]["review_profile"]["review_status"] == "unreviewed"
    assert body["job_detail"]["review_profile"]["match_score"] >= 0
