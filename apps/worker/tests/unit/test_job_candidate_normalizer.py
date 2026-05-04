from app.services.job_candidate_normalizer import normalize_candidate


def test_normalizer_accepts_contact_keyword_and_evidence(sample_linkedin_candidate: dict[str, object]) -> None:
    normalized = normalize_candidate(sample_linkedin_candidate)
    assert normalized["outcome"] == "accepted"
    assert normalized["rejection_reason"] is None


def test_normalizer_rejects_missing_contact(sample_linkedin_candidate: dict[str, object]) -> None:
    candidate = {**sample_linkedin_candidate, "contact_channel_value": ""}
    normalized = normalize_candidate(candidate)
    assert normalized["outcome"] == "rejected_no_contact"


def test_normalizer_rejects_linkedin_contact_without_profile(sample_linkedin_candidate: dict[str, object]) -> None:
    candidate = {
        **sample_linkedin_candidate,
        "contact_channel_type": "linkedin",
        "contact_channel_value": "https://www.linkedin.com/in/recruiter-example",
        "poster_profile_url": "",
    }
    normalized = normalize_candidate(candidate)
    assert normalized["outcome"] == "rejected_no_contact"


def test_normalizer_maps_blocked_provider_status(sample_linkedin_candidate: dict[str, object]) -> None:
    candidate = {**sample_linkedin_candidate, "provider_status": "blocked"}
    normalized = normalize_candidate(candidate)
    assert normalized["outcome"] == "blocked_source"


def test_normalizer_accepts_missing_keyword_match(sample_linkedin_candidate: dict[str, object]) -> None:
    candidate = {**sample_linkedin_candidate, "matched_keywords": []}
    normalized = normalize_candidate(candidate)
    assert normalized["outcome"] == "accepted"
    assert normalized["matched_keywords"] == []
