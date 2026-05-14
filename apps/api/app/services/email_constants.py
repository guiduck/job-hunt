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

EMAIL_RE = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}$")
EMAIL_CANDIDATE_RE = re.compile(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+[A-Za-z0-9]")
COMMON_EMAIL_TLDS = [
    "com.br",
    "com",
    "net",
    "org",
    "io",
    "co",
    "ai",
    "dev",
    "tech",
    "software",
    "global",
    "br",
    "us",
    "uk",
    "ca",
    "de",
    "fr",
    "es",
    "pt",
    "au",
    "ar",
    "cl",
    "mx",
    "pe",
    "uy",
    "eu",
    "in",
]
TEMPLATE_VAR_RE = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")


def sanitize_email_address(value: str | None) -> str | None:
    if value is None:
        return None
    email = value.strip()
    if not email:
        return None
    if email.lower().startswith("mailto:"):
        email = email[7:]
    match = EMAIL_CANDIDATE_RE.search(email)
    if match:
        email = match.group(0)
    email = email.strip().strip(".,;:)]}>\"'")
    if "@" not in email:
        return email
    if "#" in email:
        before_hash = email.split("#", 1)[0].strip().strip(".,;:)]}>\"'")
        if EMAIL_RE.match(before_hash):
            return before_hash
        email = before_hash
    if any(char.isspace() for char in email):
        first_token = email.split()[0].strip().strip(".,;:)]}>\"'")
        if EMAIL_RE.match(first_token):
            return first_token
        email = first_token

    local, domain = email.rsplit("@", 1)
    labels = domain.split(".")
    if len(labels) < 2:
        return email

    lower_labels = [label.lower() for label in labels]
    if len(labels) >= 3 and lower_labels[-2] == "com" and lower_labels[-1].startswith("br") and lower_labels[-1] != "br":
        labels[-2] = "com"
        labels[-1] = "br"
        return f"{local}@{'.'.join(labels).lower()}"

    last_label = lower_labels[-1]
    if last_label.endswith("hashtag") and last_label != "hashtag":
        recovered_label = last_label[: -len("hashtag")]
        if re.fullmatch(r"[a-z]{2,63}", recovered_label):
            labels[-1] = recovered_label
            recovered = f"{local}@{'.'.join(labels).lower()}"
            if EMAIL_RE.match(recovered):
                return recovered

    for tld in sorted(COMMON_EMAIL_TLDS, key=len, reverse=True):
        if "." in tld:
            continue
        if last_label == tld:
            return f"{local}@{domain.lower()}"

    return f"{local}@{domain.lower()}"


def is_valid_email(value: str | None) -> bool:
    return bool(value and EMAIL_RE.match(value.strip()))
