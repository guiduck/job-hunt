from __future__ import annotations

import re

FULL_TIME_MODE = "full_time"
JOB_APPLICATION = "job_application"
JOB_FOLLOW_UP = "job_follow_up"
SUPPORTED_TEMPLATE_KINDS = {JOB_APPLICATION, JOB_FOLLOW_UP}
SUPPORTED_TEMPLATE_VARIABLES = {
    "company_name",
    "job_title",
    "author_name",
    "matched_keywords",
    "source_url",
    "resume_name",
    "operator_name",
    "operator_email",
}

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TEMPLATE_VAR_RE = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")


def is_valid_email(value: str | None) -> bool:
    return bool(value and EMAIL_RE.match(value.strip()))
