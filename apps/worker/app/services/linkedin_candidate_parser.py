import re

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
LINKEDIN_PROFILE_RE = re.compile(r"https?://(?:www\.)?linkedin\.com/in/[A-Z0-9_\-/%]+", re.IGNORECASE)
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
LOCAL_PREFIX_NOISE = [
    "oportunidadlaboral",
    "oportunidade",
    "opportunity",
    "jobopportunity",
    "vacante",
    "vaga",
    "vagas",
    "contact",
    "contato",
    "email",
    "mail",
    "apply",
    "resume",
    "curriculo",
    "cv",
    "send",
    "communication",
]
CONTACT_INVITATION_PATTERNS = [
    r"\b(dm|dms|direct message|inbox)\s+(me|us)\b",
    r"\b(send|drop|shoot)\s+(me|us)\s+(a\s+)?(dm|message|note)\b",
    r"\b(message|contact|reach out to)\s+(me|us)\b",
    r"\b(apply|send your resume|send your cv)\s+(by|via|through)\s+(dm|direct message|inbox|linkedin)\b",
    r"\b(me chame|chama|chame|me chama|manda|mande|envie|envia)\s+(no|um|uma)?\s*(dm|direct|inbox|mensagem)\b",
    r"\b(entre em contato|fale comigo|fale conosco|me envie mensagem|envie mensagem|mande mensagem)\b",
]
CONTACT_INVITATION_RES = [re.compile(pattern, re.IGNORECASE) for pattern in CONTACT_INVITATION_PATTERNS]
POSTER_NAME_PATTERNS = [
    re.compile(r"^Publicacao no feed\s*(.+?)(?:\s+-\s+|\s+Seguir\b|\s+Follow\b|\s+\d|\s*$)", re.IGNORECASE),
    re.compile(r"^Publica(?:ç|c)[aã]o no feed\s*(.+?)(?:\s+[-•]|\s+Seguir\b|\s+Follow\b|\s+\d|\s*$)", re.IGNORECASE),
    re.compile(r"^Publica(?:Ã§|c)[aÃ£]o no feed\s*(.+?)(?:\s+[-â€¢]|\s+Seguir\b|\s+Follow\b|\s+\d|\s*$)", re.IGNORECASE),
]


def extract_public_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return normalize_public_email(match.group(0)) if match else None


def normalize_public_email(value: str) -> str:
    email = value.strip().strip(".,;:)]}>\"'")
    if "@" not in email:
        return email
    local, domain = email.rsplit("@", 1)
    local = strip_glued_local_prefix(local)
    labels = domain.split(".")
    if len(labels) < 2:
        return email

    normalized_labels = labels[:]
    lower_labels = [label.lower() for label in labels]
    if len(labels) >= 3 and lower_labels[-2] == "com" and lower_labels[-1].startswith("br"):
        normalized_labels[-2] = "com"
        normalized_labels[-1] = "br"
    else:
        last_label = lower_labels[-1]
        for tld in COMMON_EMAIL_TLDS:
            if "." in tld:
                continue
            if last_label.startswith(tld):
                normalized_labels[-1] = tld
                break

    return f"{local}@{'.'.join(normalized_labels).lower()}"


def strip_glued_local_prefix(local: str) -> str:
    lowered = local.lower()
    for prefix in sorted(LOCAL_PREFIX_NOISE, key=len, reverse=True):
        if lowered.startswith(prefix) and len(local) > len(prefix) + 2:
            return local[len(prefix) :]
    return local


def extract_linkedin_profile_url(text: str) -> str | None:
    match = LINKEDIN_PROFILE_RE.search(text)
    return match.group(0).rstrip(".,)") if match else None


def invites_linkedin_dm(text: str) -> bool:
    return any(pattern.search(text) for pattern in CONTACT_INVITATION_RES)


def extract_poster_name(text: str) -> str | None:
    for pattern in POSTER_NAME_PATTERNS:
        match = pattern.search(text.strip())
        if not match:
            continue
        name = dedupe_repeated_name(match.group(1).strip().rstrip("."))
        return name if 0 < len(name) <= 120 else None
    return None


def dedupe_repeated_name(name: str) -> str:
    compact = name.strip()
    if len(compact) % 2 == 0:
        midpoint = len(compact) // 2
        first_half = compact[:midpoint]
        second_half = compact[midpoint:]
        if first_half.lower() == second_half.lower():
            return first_half.strip()

    parts = [part for part in name.split() if part]
    if len(parts) % 2 != 0:
        return name

    midpoint = len(parts) // 2
    first_half = " ".join(parts[:midpoint])
    second_half = " ".join(parts[midpoint:])
    return first_half if first_half == second_half else name


def parse_candidate(raw: dict[str, object], requested_keywords: list[str]) -> dict[str, object]:
    text = " ".join(
        str(raw.get(key) or "")
        for key in ["company_name", "role_title", "post_headline", "job_description", "source_evidence"]
    )
    matched_keywords = [keyword for keyword in requested_keywords if keyword.lower() in text.lower()]
    email = extract_public_email(text)
    poster_profile_url = str(raw.get("poster_profile_url") or "") or (extract_linkedin_profile_url(text) or "")
    explicit_dm_contact = invites_linkedin_dm(text) and bool(poster_profile_url)
    contact = str(raw.get("contact_channel_value") or "") or email or (poster_profile_url if explicit_dm_contact else "")
    contact_channel_type = "email" if email else ("linkedin" if explicit_dm_contact else str(raw.get("contact_channel_type") or ""))
    contact_priority = "primary" if contact_channel_type == "email" else ("secondary" if contact_channel_type == "linkedin" else "")
    evidence = str(raw.get("source_evidence") or "")
    if not evidence and contact:
        evidence = f"Public contact found: {contact}"
    poster_name = str(raw.get("poster_name") or "") or (extract_poster_name(evidence or text) or "")

    return {
        "poster_name": poster_name,
        "company_name": str(raw.get("company_name") or ""),
        "role_title": str(raw.get("role_title") or ""),
        "post_headline": str(raw.get("post_headline") or ""),
        "job_description": str(raw.get("job_description") or ""),
        "contact_channel_type": contact_channel_type,
        "contact_channel_value": contact,
        "contact_email": email or "",
        "poster_profile_url": poster_profile_url,
        "contact_priority": contact_priority,
        "source_url": str(raw.get("source_url") or ""),
        "source_query": str(raw.get("source_query") or " ".join(requested_keywords)),
        "source_evidence": evidence,
        "matched_keywords": matched_keywords,
        "collection_source_type": str(raw.get("collection_source_type") or ""),
        "hiring_intent_term": str(raw.get("hiring_intent_term") or ""),
        "provider_name": str(raw.get("provider_name") or ""),
        "provider_status": str(raw.get("provider_status") or "collected"),
        "provider_error_code": str(raw.get("provider_error_code") or ""),
        "raw_excerpt": str(raw.get("raw_excerpt") or text[:1000]),
        "rejection_reason": str(raw.get("rejection_reason") or ""),
    }
