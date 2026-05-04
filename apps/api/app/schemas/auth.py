from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    subscription_status: str
    subscription_plan: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PasswordResetRequestIn(BaseModel):
    email: EmailStr


class PasswordResetAccepted(BaseModel):
    status: str = "accepted"


class PasswordResetConfirmRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)
