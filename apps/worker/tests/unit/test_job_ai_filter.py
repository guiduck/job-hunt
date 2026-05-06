from app.services.job_ai_filter import evaluate_ai_filter, normalize_ai_filter_settings


def test_ai_filter_passes_valid_high_confidence_output(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(
        sample_review_candidate,
        settings,
        enabled=True,
        provider=lambda _payload: {
            "passes": True,
            "reason": "Remote LATAM role.",
            "confidence": 0.92,
            "signals": {"detected_work_mode": "remote", "accepted_regions": ["LATAM"]},
        },
        model_name="test-model",
    )

    assert decision.ai_filter_status == "passed"
    assert decision.passes_ai_filter is True
    assert decision.ai_filter_model_name == "test-model"


def test_ai_filter_rejects_valid_high_confidence_output(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(
        sample_review_candidate,
        settings,
        enabled=True,
        provider=lambda _payload: {
            "passes": False,
            "reason": "Requires onsite work.",
            "confidence": 0.88,
            "signals": {"detected_work_mode": "onsite", "matched_exclusion_keywords": ["onsite"]},
        },
    )

    assert decision.ai_filter_status == "rejected"
    assert decision.passes_ai_filter is False


def test_ai_filter_low_confidence_falls_back(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(
        sample_review_candidate,
        settings,
        enabled=True,
        provider=lambda _payload: {"passes": False, "reason": "Unclear.", "confidence": 0.42, "signals": {}},
    )

    assert decision.ai_filter_status == "fallback"
    assert decision.passes_ai_filter is True
    assert decision.ai_filter_error_code == "low_confidence"


def test_ai_filter_missing_provider_falls_back(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(sample_review_candidate, settings, enabled=True, provider=None)

    assert decision.ai_filter_status == "fallback"
    assert decision.ai_filter_error_code == "ai_not_configured"


def test_ai_filter_invalid_output_falls_back(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(sample_review_candidate, settings, enabled=True, provider=lambda _payload: {"passes": "yes"})

    assert decision.ai_filter_status == "fallback"
    assert decision.ai_filter_error_code == "invalid_ai_output"


def test_ai_filter_provider_unavailable_falls_back(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    def unavailable(_payload: dict[str, object]) -> dict[str, object]:
        raise RuntimeError("rate limited")

    decision = evaluate_ai_filter(sample_review_candidate, settings, enabled=True, provider=unavailable)

    assert decision.ai_filter_status == "fallback"
    assert decision.ai_filter_error_code == "ai_unavailable"


def test_ai_filter_fallback_uses_legacy_contact_filter(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)
    candidate = {**sample_review_candidate, "source_evidence": "Remote TypeScript role with public contact."}

    decision = evaluate_ai_filter(candidate, settings, enabled=True, provider=None)

    assert decision.ai_filter_status == "fallback"
    assert decision.passes_ai_filter is True
    assert decision.ai_filter_error_code == "ai_not_configured"


def test_ai_filter_rejects_obvious_job_seeker_post(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)
    candidate = {
        **sample_review_candidate,
        "source_evidence": (
            "Olá, amigos! Estou em busca de uma oportunidade como desenvolvedor frontend. "
            "Segue meu email jose@example.com"
        ),
    }

    decision = evaluate_ai_filter(candidate, settings, enabled=True, provider=lambda _payload: {"passes": True})

    assert decision.ai_filter_status == "rejected"
    assert decision.passes_ai_filter is False
    assert decision.ai_filter_signals["is_job_seeker_post"] is True


def test_ai_filter_rejects_human_post_focused_on_finding_opportunity(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)
    candidate = {
        **sample_review_candidate,
        "source_evidence": (
            "Tenho compartilhado a evolucao do meu projeto Full Stack. "
            "Estou focado em encontrar uma oportunidade onde eu possa somar. "
            "Minhas linguagens: JavaScript, TypeScript, Python e Java."
        ),
    }

    decision = evaluate_ai_filter(candidate, settings, enabled=True, provider=lambda _payload: {"passes": True})

    assert decision.ai_filter_status == "rejected"
    assert decision.passes_ai_filter is False
    assert decision.ai_filter_signals["speaker_type"] == "job_seeker"


def test_ai_filter_rejects_high_confidence_ai_job_seeker_signal(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)

    decision = evaluate_ai_filter(
        sample_review_candidate,
        settings,
        enabled=True,
        provider=lambda _payload: {
            "passes": True,
            "reason": "Looks relevant.",
            "confidence": 0.91,
            "signals": {"speaker_type": "job_seeker", "is_job_seeker_post": True, "has_real_job_opening": False},
        },
    )

    assert decision.ai_filter_status == "rejected"
    assert decision.passes_ai_filter is False


def test_ai_filter_skips_earlier_rejected_candidates(
    sample_review_candidate: dict[str, object],
    ai_filter_settings_payload: dict[str, object],
) -> None:
    settings = normalize_ai_filter_settings(ai_filter_settings_payload)
    candidate = {**sample_review_candidate, "outcome": "duplicate"}

    decision = evaluate_ai_filter(candidate, settings, enabled=True, provider=lambda _payload: {})

    assert decision.ai_filter_status == "skipped"
    assert decision.passes_ai_filter is None
