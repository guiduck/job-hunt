from app.services.email_constants import is_valid_email, sanitize_email_address


def test_email_sanitization_preserves_valid_addresses() -> None:
    samples = [
        "dev+jobs@example.com",
        "first.last@example.co.uk",
        "jobs@sub-domain.example.io",
        "talent@company.com.br",
    ]

    for email in samples:
        assert sanitize_email_address(email) == email
        assert is_valid_email(email)


def test_email_sanitization_removes_attached_invalid_suffixes() -> None:
    assert sanitize_email_address("vagas@locus.softwarehashtag") == "vagas@locus.software"
    assert sanitize_email_address("Contact: email@dominio.comhashtag") == "email@dominio.com"
    assert sanitize_email_address("jobs@example.comhashtag") == "jobs@example.com"
    assert sanitize_email_address("jobs@example.com#hashtag") == "jobs@example.com"
    assert sanitize_email_address("jobs@example.com #hashtag") == "jobs@example.com"
    assert sanitize_email_address("jobs@example.com,") == "jobs@example.com"
    assert sanitize_email_address("jobs@example.com apply here") == "jobs@example.com"


def test_email_sanitization_leaves_unrecoverable_values_invalid() -> None:
    assert sanitize_email_address("not-an-email") == "not-an-email"
    assert sanitize_email_address("jobs@example") == "jobs@example"
    assert not is_valid_email(sanitize_email_address("jobs@example"))
