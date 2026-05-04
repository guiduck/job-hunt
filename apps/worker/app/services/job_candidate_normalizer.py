from enum import StrEnum


class CandidateOutcome(StrEnum):
    ACCEPTED = "accepted"
    REJECTED_NO_CONTACT = "rejected_no_contact"
    REJECTED_WEAK_MATCH = "rejected_weak_match"
    REJECTED_MISSING_EVIDENCE = "rejected_missing_evidence"
    FAILED_PROVIDER = "failed_provider"
    BLOCKED_SOURCE = "blocked_source"
    INACCESSIBLE_SOURCE = "inaccessible_source"
    EMPTY_SOURCE = "empty_source"


def normalize_candidate(candidate: dict[str, object]) -> dict[str, object]:
    matched_keywords = [str(value) for value in candidate.get("matched_keywords", []) if value]
    contact = str(candidate.get("contact_channel_value") or "")
    contact_channel_type = str(candidate.get("contact_channel_type") or "")
    poster_profile_url = str(candidate.get("poster_profile_url") or "")
    provider_status = str(candidate.get("provider_status") or "collected")
    evidence = str(candidate.get("source_evidence") or "")

    provider_outcomes = {
        "blocked": CandidateOutcome.BLOCKED_SOURCE.value,
        "inaccessible": CandidateOutcome.INACCESSIBLE_SOURCE.value,
        "empty": CandidateOutcome.EMPTY_SOURCE.value,
        "failed": CandidateOutcome.FAILED_PROVIDER.value,
    }
    if provider_status in provider_outcomes:
        return {
            **candidate,
            "outcome": provider_outcomes[provider_status],
            "rejection_reason": candidate.get("rejection_reason") or f"Provider status: {provider_status}",
        }

    if not contact:
        return {**candidate, "outcome": CandidateOutcome.REJECTED_NO_CONTACT.value, "rejection_reason": "Missing public contact"}
    if contact_channel_type == "linkedin" and not poster_profile_url:
        return {**candidate, "outcome": CandidateOutcome.REJECTED_NO_CONTACT.value, "rejection_reason": "Missing LinkedIn poster profile URL"}
    if not evidence:
        return {**candidate, "outcome": CandidateOutcome.REJECTED_MISSING_EVIDENCE.value, "rejection_reason": "Missing evidence"}

    return {**candidate, "matched_keywords": matched_keywords, "outcome": CandidateOutcome.ACCEPTED.value, "rejection_reason": None}
