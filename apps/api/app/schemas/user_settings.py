from datetime import datetime
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserSettingsUpdate(BaseModel):
    operator_name: str | None = None
    operator_email: EmailStr | None = None
    portfolio_url: str | None = None
    operator_linkedin_url: str | None = None

    @field_validator("operator_linkedin_url")
    @classmethod
    def validate_operator_linkedin_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        parsed = urlparse(normalized)
        host = parsed.netloc.lower()
        if parsed.scheme not in {"http", "https"} or host not in {"linkedin.com", "www.linkedin.com"}:
            raise ValueError("operator_linkedin_url must be a LinkedIn profile URL")
        if not parsed.path.rstrip("/").lower().startswith("/in/"):
            raise ValueError("operator_linkedin_url must point to a LinkedIn profile")
        return normalized


class UserSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    operator_name: str | None = None
    operator_email: EmailStr | None = None
    portfolio_url: str | None = None
    operator_linkedin_url: str | None = None
    default_mode: str = "full_time"
    created_at: datetime
    updated_at: datetime


class ResumeCreate(BaseModel):
    display_name: str
    file_name: str
    file_path: str
    mime_type: str
    file_size_bytes: int | None = Field(default=None, ge=0)
    sha256: str | None = None


class ResumeUpdate(BaseModel):
    display_name: str | None = None
    is_available: bool | None = None
    is_default: bool | None = None
    include_in_field_assistant_context: bool | None = None


class ResumeAttachment(ResumeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_available: bool
    is_default: bool
    include_in_field_assistant_context: bool
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime
