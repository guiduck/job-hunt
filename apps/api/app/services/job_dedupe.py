import re


def normalize_part(value: str | None) -> str:
    if not value:
        return ""
    normalized = re.sub(r"\s+", " ", value.strip().lower())
    return re.sub(r"[^a-z0-9@.+# -]", "", normalized)


def build_job_dedupe_key(
    company_name: str | None,
    role_title: str | None,
    post_headline: str | None,
    matched_keywords: list[str],
    contact_channel_value: str,
    source_url: str | None = None,
) -> str:
    title = role_title or post_headline or ""
    keywords = ",".join(sorted({normalize_part(keyword) for keyword in matched_keywords if keyword}))
    company = normalize_part(company_name)
    normalized_title = normalize_part(title)
    parts = [company, normalized_title, keywords, normalize_part(contact_channel_value)]
    if not company and not normalized_title:
        parts.append(normalize_part(source_url))
    return "|".join(parts)
