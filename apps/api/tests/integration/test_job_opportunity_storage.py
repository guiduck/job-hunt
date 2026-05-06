from fastapi.testclient import TestClient


def sample_payload() -> dict[str, object]:
    return {
        "opportunity_type": "job",
        "title": "Frontend Engineer",
        "organization_name": "Example Co",
        "source_name": "LinkedIn",
        "source_url": "https://www.linkedin.com/jobs/view/example",
        "source_query": "reactjs typescript email",
        "source_evidence": "Email jobs@example.com with your resume.",
        "job_detail": {
            "company_name": "Example Co",
            "role_title": "Frontend Engineer",
            "post_headline": "Hiring React Developer",
            "job_description": "We use React, TypeScript, and Next.js.",
            "contact_channel_type": "email",
            "contact_channel_value": "jobs@example.com",
            "matched_keywords": ["reactjs", "typescript"],
        },
    }


def test_create_and_retrieve_sample_job_opportunity(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/opportunities", json=sample_payload(), headers=auth_headers)
    assert created.status_code == 201
    opportunity_id = created.json()["id"]

    fetched = client.get(f"/opportunities/{opportunity_id}", headers=auth_headers)
    assert fetched.status_code == 200
    body = fetched.json()
    assert body["opportunity_type"] == "job"
    assert body["source_query"] == "reactjs typescript email"
    assert body["job_detail"]["contact_channel_value"] == "jobs@example.com"
    assert body["job_detail"]["matched_keywords"] == ["reactjs", "typescript"]


def test_delete_sample_job_opportunity(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post("/opportunities", json=sample_payload(), headers=auth_headers)
    assert created.status_code == 201
    opportunity_id = created.json()["id"]

    deleted = client.delete(f"/opportunities/{opportunity_id}", headers=auth_headers)

    assert deleted.status_code == 204
    fetched = client.get(f"/opportunities/{opportunity_id}", headers=auth_headers)
    assert fetched.status_code == 404


def test_bulk_delete_sample_job_opportunities(client: TestClient, auth_headers: dict[str, str]) -> None:
    first = client.post("/opportunities", json=sample_payload(), headers=auth_headers)
    second_payload = sample_payload()
    second_payload["title"] = "Backend Engineer"
    second_payload["organization_name"] = "Second Co"
    second_payload["source_url"] = "https://www.linkedin.com/jobs/view/example-2"
    second_payload["source_evidence"] = "Email backend@example.com with your resume."
    second_payload["job_detail"]["company_name"] = "Second Co"
    second_payload["job_detail"]["role_title"] = "Backend Engineer"
    second_payload["job_detail"]["contact_channel_value"] = "backend@example.com"
    second = client.post("/opportunities", json=second_payload, headers=auth_headers)
    assert first.status_code == 201
    assert second.status_code == 201

    response = client.post(
        "/opportunities/bulk-delete",
        json={"opportunity_ids": [first.json()["id"], second.json()["id"]]},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["deleted_count"] == 2
