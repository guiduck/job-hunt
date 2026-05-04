from fastapi.testclient import TestClient


def test_preview_renders_opportunity_values_and_missing_warnings(
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
            "subject_template": "Application for {{job_title}} at {{company_name}}",
            "body_template": "Hi {{author_name}}, keywords: {{matched_keywords}}. Source: {{source_url}}. CV: {{resume_name}}",
        },
    ).json()

    response = client.post(
        f"/email-templates/{template['id']}/preview",
        json={"opportunity_id": opportunity["id"]},
    )

    assert response.status_code == 200
    preview = response.json()
    assert "Senior TypeScript Developer" in preview["subject"]
    assert "Example Co" in preview["subject"]
    assert any("author_name" in warning for warning in preview["warnings"])
    assert any("resume_name" in warning for warning in preview["warnings"])
