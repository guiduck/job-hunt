from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.email import SendRequest, SendRequestStatus, TemplateKind
from app.models.user import User
from app.services import bulk_email_service


def test_bulk_ai_generate_review_edit_and_approve(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    client.patch("/user-settings", headers=auth_headers, json={"portfolio_url": "https://example.com"})
    monkeypatch.setattr(
        bulk_email_service,
        "generate_job_application_email",
        lambda _context: {"subject": "Application for TypeScript role", "body": "Hi, I would like to apply."},
    )

    generated = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert generated.status_code == 201
    body = generated.json()
    assert body["sendable_count"] == 1
    assert body["items"][0]["subject"] == "Application for TypeScript role"

    edited = client.patch(
        f"/bulk-email/{body['id']}/items/{opportunity['id']}",
        headers=auth_headers,
        json={"recipient_email": "edited@example.com", "subject": "Edited subject", "body": "Edited body"},
    )
    assert edited.status_code == 200
    assert edited.json()["items"][0]["recipient_email"] == "edited@example.com"

    approved = client.post(f"/bulk-email/{body['id']}/approve", headers=auth_headers)
    assert approved.status_code == 200
    approved_item = approved.json()["items"][0]
    assert approved_item["send_request_id"]
    assert approved_item["subject"] == "Edited subject"


def test_bulk_ai_generation_uses_resume_text_and_template_reference(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    captured_context: dict[str, object] = {}
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    resume = client.post(
        "/user-settings/resumes",
        headers=auth_headers,
        json={
            "display_name": "React Resume",
            "file_name": "react-resume.pdf",
            "file_path": ".local/resumes/react-resume.pdf",
            "mime_type": "application/pdf",
        },
    ).json()
    template = client.post(
        "/email-templates",
        headers=auth_headers,
        json={
            "mode": "full_time",
            "template_kind": "job_application",
            "name": "Direct application",
            "subject_template": "React application",
            "body_template": "Use a concise, direct application email.",
        },
    ).json()
    monkeypatch.setattr(
        bulk_email_service,
        "_extract_resume_text",
        lambda _resume: ("7 years of experience with React, JavaScript, TypeScript, and frontend architecture.", "ok"),
    )

    def generate(context: dict[str, object]) -> dict[str, str]:
        captured_context.update(context)
        return {"subject": "React application", "body": "Hi, I have 7 years of React experience."}

    monkeypatch.setattr(bulk_email_service, "generate_job_application_email", generate)

    generated = client.post(
        "/bulk-email/generate-ai",
        headers=auth_headers,
        json={"opportunity_ids": [opportunity["id"]], "resume_attachment_id": resume["id"], "template_id": template["id"]},
    )

    assert generated.status_code == 201
    assert "7 years of experience with React" in captured_context["resume"]["text_excerpt"]
    assert captured_context["template_reference"]["body_template"] == "Use a concise, direct application email."
    assert "Do not mention .NET" in " ".join(captured_context["strict_claim_rules"])


def test_bulk_ai_generation_detects_job_post_language(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    captured_context: dict[str, object] = {}
    spanish_payload = {
        **review_ready_job_payload,
        "source_evidence": "Estamos contratando. Buscamos desarrollador frontend con experiencia en React.",
        "job_detail": {
            **review_ready_job_payload["job_detail"],
            "post_headline": "Buscamos desarrollador frontend",
            "job_description": "Requisitos: experiencia con React, TypeScript y trabajo en equipo remoto.",
        },
    }
    opportunity = client.post("/opportunities", headers=auth_headers, json=spanish_payload).json()

    def generate(context: dict[str, object]) -> dict[str, str]:
        captured_context.update(context)
        return {"subject": "Aplicación frontend", "body": "Hola, me interesa la oportunidad."}

    monkeypatch.setattr(bulk_email_service, "generate_job_application_email", generate)

    generated = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert generated.status_code == 201
    assert captured_context["language"]["detected_language"] == "Spanish"
    assert "Write the subject and body in Spanish" in captured_context["language"]["instruction"]


def test_bulk_ai_generation_keeps_duplicates_unsendable(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    test_user: User,
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    db_session.add(
        SendRequest(
            user_id=test_user.id,
            opportunity_id=opportunity["id"],
            template_id=None,
            template_kind=TemplateKind.JOB_APPLICATION.value,
            recipient_email="jobs@example.com",
            subject_snapshot="Already sent",
            body_snapshot="Already sent",
            resume_snapshot={},
            status=SendRequestStatus.SENT.value,
        )
    )
    db_session.commit()
    monkeypatch.setattr(
        bulk_email_service,
        "generate_job_application_email",
        lambda _context: {"subject": "Application", "body": "Hi"},
    )

    generated = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert generated.status_code == 201
    assert generated.json()["skipped_duplicate_count"] == 1
    assert generated.json()["items"][0]["outcome"] == "skipped_duplicate"


def test_bulk_ai_generation_returns_structured_ai_error(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
    review_ready_job_payload: dict[str, object],
) -> None:
    opportunity = client.post("/opportunities", headers=auth_headers, json=review_ready_job_payload).json()
    monkeypatch.setattr(
        bulk_email_service,
        "generate_job_application_email",
        lambda _context: (_ for _ in ()).throw(
            bulk_email_service.AIEmailGenerationError(
                "OpenAI rejected OPENAI_API_KEY (401). Confirm the key is valid.",
                code="openai_unauthorized",
            )
        ),
    )

    generated = client.post("/bulk-email/generate-ai", headers=auth_headers, json={"opportunity_ids": [opportunity["id"]]})

    assert generated.status_code == 201
    item = generated.json()["items"][0]
    assert item["outcome"] == "ai_generation_failed"
    assert item["ai_error_code"] == "openai_unauthorized"
    assert "OpenAI rejected OPENAI_API_KEY" in item["reason"]
