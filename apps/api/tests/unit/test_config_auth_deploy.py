from app.core.config import Settings


def test_auth_and_oauth_config_fields_load_from_environment_names():
    settings = Settings(
        auth_session_ttl_hours=6,
        auth_token_bytes=48,
        password_reset_token_ttl_minutes=45,
        gmail_oauth_client_config_json='{"installed":{}}',
        gmail_oauth_redirect_uri="https://api.example.com/sending/google-oauth/callback",
    )

    assert settings.auth_session_ttl_hours == 6
    assert settings.auth_token_bytes == 48
    assert settings.password_reset_token_ttl_minutes == 45
    assert settings.gmail_oauth_client_config_json == '{"installed":{}}'
    assert settings.gmail_oauth_redirect_uri == "https://api.example.com/sending/google-oauth/callback"
