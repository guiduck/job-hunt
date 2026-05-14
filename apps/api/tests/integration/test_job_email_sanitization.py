from fastapi.testclient import TestClient


def test_captured_job_contact_email_is_sanitized_before_storage(
    client: TestClient,
    auth_headers: dict[str, str],
    review_ready_job_payload: dict[str, object],
) -> None:
    payload = {
        **review_ready_job_payload,
        "job_detail": {
            **review_ready_job_payload["job_detail"],
            "contact_channel_value": "vagas@locus.softwarehashtag",
            "contact_email": "vagas@locus.softwarehashtag",
        },
    }

    response = client.post("/opportunities", headers=auth_headers, json=payload)

    assert response.status_code == 201
    detail = response.json()["job_detail"]
    assert detail["contact_email"] == "vagas@locus.software"
    assert detail["contact_channel_value"] == "vagas@locus.software"
