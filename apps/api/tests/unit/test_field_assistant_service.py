import pytest

from app.schemas.field_assistant import FieldAnswerGenerateRequest
from app.services.field_assistant_service import ensure_safe_generation_request, normalize_keyword, normalize_scope_value


def test_normalize_scope_value_base_domain() -> None:
    assert normalize_scope_value("base_domain", "https://www.greenhouse.io/company/apply?utm_source=x") == "greenhouse.io"


def test_normalize_scope_value_exact_page_removes_tracking() -> None:
    value = normalize_scope_value("exact_page", "https://jobs.example.com/apply?job=123&utm_source=x&fbclid=y#section")

    assert value == "https://jobs.example.com/apply?job=123"


def test_normalize_scope_value_rejects_invalid_domain() -> None:
    with pytest.raises(ValueError):
        normalize_scope_value("base_domain", "localhost")


def test_normalize_keyword() -> None:
    assert normalize_keyword("English Level / Fluency") == "english_level_fluency"


def test_ensure_safe_generation_request_rejects_sensitive_field() -> None:
    payload = FieldAnswerGenerateRequest(
        keyword="payment",
        field_context={"label_text": "Credit card number", "field_type": "textarea", "confidence": 0.8},
        page_context={"origin": "https://jobs.example.com"},
    )

    with pytest.raises(Exception):
        ensure_safe_generation_request(payload)
