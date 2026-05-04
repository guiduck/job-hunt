from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    database_url: str = "sqlite+pysqlite:///:memory:"
    worker_poll_interval_seconds: int = 5
    worker_run_once: bool = False
    worker_max_runs_per_loop: int = 1
    worker_mark_stale_running_on_startup: bool = True
    linkedin_hiring_intent_terms: list[str] = ["hiring", "contratando", "contratamos"]
    linkedin_request_timeout_seconds: float = 10.0
    linkedin_user_agent: str = "scrapper-freelance-worker/0.1 public-data-validation"
    job_review_ai_analysis_enabled: bool = False
    job_review_ai_model_name: str | None = None
    job_review_ai_prompt_version: str = "job-review-v1"
    resume_storage_backend: str = "local_fs"
    resume_storage_dir: str | None = None
    email_provider: str = "gmail"
    gmail_oauth_client_config_json: str | None = None
    email_send_poll_interval_seconds: int = 5
    gmail_oauth_client_secrets_file: str | None = None
    gmail_oauth_token_file: str | None = None
    gmail_oauth_scopes: str = "https://www.googleapis.com/auth/gmail.send"
    gmail_oauth_redirect_uri: str = "http://localhost:8000/sending/google-oauth/callback"

    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), extra="ignore")


@lru_cache
def get_worker_settings() -> WorkerSettings:
    return WorkerSettings()
