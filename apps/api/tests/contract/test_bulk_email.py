from fastapi.testclient import TestClient


def test_bulk_preview_and_approve(
    client: TestClient,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", json=review_ready_job_payload).json()
    template = client.post(
        "/email-templates",
        json={
            "mode": "full_time",
            "template_kind": "job_application",
            "name": "Application",
            "subject_template": "Application",
            "body_template": "Hi",
        },
    ).json()

    preview = client.post("/bulk-email/preview", json={"opportunity_ids": [opportunity["id"]], "template_id": template["id"]})
    assert preview.status_code == 200
    assert preview.json()["sendable_count"] == 1

    approved = client.post(f"/bulk-email/{preview.json()['id']}/approve")
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
