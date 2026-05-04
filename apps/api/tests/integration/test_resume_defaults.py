from fastapi.testclient import TestClient


def test_newest_resume_defaults_and_no_cv_warning(
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
            "subject_template": "Application for {{job_title}}",
            "body_template": "CV: {{resume_name}}",
        },
    ).json()
    resume = client.post(
        "/user-settings/resumes",
        json={
            "display_name": "Newest CV",
            "file_name": "newest.pdf",
            "file_path": ".local/resumes/newest.pdf",
            "mime_type": "application/pdf",
        },
    ).json()

    draft = client.post("/email-drafts", json={"opportunity_id": opportunity["id"], "template_id": template["id"]}).json()
    assert draft["resume_attachment_id"] == resume["id"]

    client.patch(f"/user-settings/resumes/{resume['id']}", json={"is_available": False})
    warning_draft = client.post("/email-drafts", json={"opportunity_id": opportunity["id"], "template_id": template["id"]}).json()
    assert any("No resume attached" in warning for warning in warning_draft["warnings"])
