from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


ScopeType = Literal["base_domain", "exact_page"]
FieldType = Literal["textarea", "long_text_input", "contenteditable"]
SuggestionSource = Literal["generated", "edited", "manual"]


class FieldAssistantActivationCreate(BaseModel):
    scope_type: ScopeType
    scope_value: str = Field(min_length=1, max_length=2048)
    display_name: str | None = Field(default=None, max_length=255)


class FieldAssistantActivationUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=255)
    enabled: bool | None = None


class FieldAssistantActivation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scope_type: ScopeType
    scope_value: str
    display_name: str | None = None
    enabled: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: datetime | None = None


class FieldAssistantActivationList(BaseModel):
    items: list[FieldAssistantActivation]


class FieldContext(BaseModel):
    label_text: str = Field(min_length=1, max_length=2000)
    placeholder: str | None = Field(default=None, max_length=500)
    field_type: FieldType = "textarea"
    existing_value: str | None = Field(default=None, max_length=4000)
    confidence: float = Field(default=0, ge=0, le=1)


class PageContext(BaseModel):
    origin: str = Field(min_length=1, max_length=2048)
    sanitized_url: str | None = Field(default=None, max_length=2048)
    page_title: str | None = Field(default=None, max_length=300)


class FieldAnswerGenerateRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=120)
    field_context: FieldContext
    page_context: PageContext
    template_hint: str | None = Field(default=None, max_length=1000)


class FieldAnswerGenerateResponse(BaseModel):
    answer_text: str
    keyword: str
    rationale: str | None = None
    missing_context: list[str] = Field(default_factory=list)
    save_default: bool = False


class FieldResponseSuggestionCreate(BaseModel):
    keyword: str = Field(min_length=1, max_length=120)
    response_text: str = Field(min_length=1)
    source: SuggestionSource
    field_label: str | None = None
    field_context_summary: str | None = None

    @field_validator("response_text")
    @classmethod
    def response_text_must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("response_text must not be blank")
        return normalized


class FieldResponseSuggestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    keyword: str
    field_label: str | None = None
    field_context_summary: str | None = None
    response_text: str
    source: SuggestionSource
    used_count: int
    last_used_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class FieldResponseSuggestionList(BaseModel):
    items: list[FieldResponseSuggestion]
