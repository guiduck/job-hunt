from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_job_only_filter_and_contact_filter(client: TestClient) -> None:
    client.post("/opportunities", json=sample_payload())

    response = client.get("/opportunities?opportunity_type=job&contact_channel=jobs@example.com&matched_keyword=reactjs")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["opportunity_type"] == "job"
    assert body[0]["job_detail"]["contact_channel_value"] == "jobs@example.com"
