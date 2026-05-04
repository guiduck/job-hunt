from app.services.email_preview_service import render_template_text


def test_render_template_text_replaces_supported_values_and_warns_for_missing() -> None:
    rendered, warnings, values = render_template_text(
        "Hello {{company_name}} {{author_name}}",
        {"company_name": "Example Co"},
    )

    assert rendered == "Hello Example Co [missing: author_name]"
    assert warnings == ["Missing template value: author_name"]
    assert values["company_name"] == "Example Co"


def test_render_template_text_ignores_freelance_only_terms() -> None:
    rendered, warnings, _ = render_template_text("Demo: {{demo_url}}", {})

    assert rendered == "Demo: [unsupported: demo_url]"
    assert warnings == ["Unsupported template variable: demo_url"]
