from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserSettingsUpdate(BaseModel):
    operator_name: str | None = None
    operator_email: EmailStr | None = None
    portfolio_url: str | None = None


class UserSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    operator_name: str | None = None
    operator_email: EmailStr | None = None
    portfolio_url: str | None = None
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


class ResumeAttachment(ResumeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_available: bool
    is_default: bool
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime
