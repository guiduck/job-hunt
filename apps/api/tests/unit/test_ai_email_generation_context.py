from types import SimpleNamespace

from app.services.bulk_email_service import _ai_generation_context


def test_ai_generation_context_includes_sender_linkedin_url_when_present() -> None:
    context = _ai_generation_context(
        _opportunity(),
        settings=SimpleNamespace(
            operator_name="Guilherme",
            operator_email="me@example.com",
            portfolio_url="https://portfolio.example.com",
            operator_linkedin_url="https://www.linkedin.com/in/guilherme",
        ),
        resume_context=None,
        template_context=None,
        recipient_email="jobs@example.com",
    )

    assert context["operator"]["linkedin_url"] == "https://www.linkedin.com/in/guilherme"


def test_ai_generation_context_does_not_invent_sender_linkedin_url() -> None:
    context = _ai_generation_context(
        _opportunity(),
        settings=SimpleNamespace(
            operator_name="Guilherme",
            operator_email="me@example.com",
            portfolio_url=None,
            operator_linkedin_url=None,
        ),
        resume_context=None,
        template_context=None,
        recipient_email="jobs@example.com",
    )

    assert context["operator"]["linkedin_url"] is None


def _opportunity() -> SimpleNamespace:
    return SimpleNamespace(
        id="opportunity-1",
        title="Senior TypeScript Developer",
        organization_name="Example Co",
        source_name="LinkedIn",
        source_url="https://www.linkedin.com/feed/update/example",
        source_evidence="Example Co is hiring. Email jobs@example.com",
        job_detail=SimpleNamespace(
            role_title="Senior TypeScript Developer",
            post_headline="Hiring Senior TypeScript Developer",
            company_name="Example Co",
            matched_keywords=["typescript"],
            job_description="Remote TypeScript role.",
            linkedin_url=None,
            application_url=None,
            poster_profile_url=None,
            contact_channel_type="email",
        ),
    )
