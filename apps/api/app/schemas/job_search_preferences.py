from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class JobSearchPreferenceUpdate(BaseModel):
    opportunity_type: Literal["job"] = "job"
    search_text: str = Field(default="", max_length=1000)


class JobSearchPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opportunity_type: Literal["job"] = "job"
    last_search_text: str = ""
    last_search_keywords: list[str] = Field(default_factory=list)
    saved_keywords: list[str] = Field(default_factory=list)
    max_saved_keywords: int = 30
    updated_at: datetime | None = None
