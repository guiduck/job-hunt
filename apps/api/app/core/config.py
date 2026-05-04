from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Scrapper Freelance API"
    database_url: str = "sqlite+pysqlite:///:memory:"
    resume_storage_backend: str = "local_fs"
    resume_storage_dir: str | None = None
    email_provider: str = "gmail"
    gmail_oauth_client_config_json: str | None = None
    gmail_oauth_client_secrets_file: str | None = None
    gmail_oauth_token_file: str | None = None
    gmail_oauth_scopes: str = "https://www.googleapis.com/auth/gmail.send"
    gmail_oauth_redirect_uri: str = "http://localhost:8000/sending/google-oauth/callback"
    gmail_oauth_success_redirect_url: str = "http://localhost:8000/health"
    auth_session_ttl_hours: int = 12
    auth_token_bytes: int = 32
    password_reset_token_ttl_minutes: int = 30
    default_local_user_email: str = "local@example.com"
    default_local_user_display_name: str = "Local Operator"
    linkedin_browser_collector_script_path: str | None = None
    linkedin_browser_collector_api_base: str = "http://localhost:8000"
    linkedin_browser_collector_log_dir: str | None = None

    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
