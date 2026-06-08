from fastapi.testclient import TestClient

from tests.integration.test_external_application_jobs import create_email_job, create_external_job


def test_metrics_split_email_and_external_counts(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_email_job(client, auth_headers)
    create_external_job(client, auth_headers)

    response = client.get("/opportunities/metrics?opportunity_type=job", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["email_job_count"] == 1
    assert body["email_unsent_count"] == 1
    assert body["external_application_count"] == 1
    assert body["external_unapplied_count"] == 1


def test_metrics_update_after_external_mark_applied_and_delete(client: TestClient, auth_headers: dict[str, str]) -> None:
    external_id = create_external_job(client, auth_headers)
    client.patch(f"/opportunities/{external_id}/mark-applied", headers=auth_headers)

    after_applied = client.get("/opportunities/metrics?opportunity_type=job", headers=auth_headers).json()
    assert after_applied["external_application_count"] == 1
    assert after_applied["external_unapplied_count"] == 0

    delete_response = client.delete(f"/opportunities/{external_id}", headers=auth_headers)
    assert delete_response.status_code == 204
    after_delete = client.get("/opportunities/metrics?opportunity_type=job", headers=auth_headers).json()
    assert after_delete["external_application_count"] == 0
