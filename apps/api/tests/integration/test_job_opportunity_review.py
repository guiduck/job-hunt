from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_update_job_stage_and_operator_notes(client: TestClient) -> None:
    created = client.post("/opportunities", json=sample_payload())
    opportunity_id = created.json()["id"]

    response = client.patch(
        f"/opportunities/{opportunity_id}",
        json={"job_stage": "saved", "operator_notes": "Worth applying this week."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["operator_notes"] == "Worth applying this week."
    assert body["job_detail"]["job_stage"] == "saved"
