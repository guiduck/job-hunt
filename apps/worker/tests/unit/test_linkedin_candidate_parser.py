from app.services.linkedin_candidate_parser import invites_linkedin_dm, parse_candidate


def test_parser_extracts_public_email_and_keywords(sample_linkedin_candidate: dict[str, object]) -> None:
    parsed = parse_candidate(sample_linkedin_candidate, ["reactjs", "typescript", "nextjs", "nodejs"])
    assert parsed["contact_channel_value"] == "jobs@example.com"
    assert parsed["matched_keywords"] == ["typescript"]
    assert parsed["source_evidence"]


def test_parser_accepts_explicit_linkedin_dm_with_profile() -> None:
    parsed = parse_candidate(
        {
            "post_headline": "Estamos contratando TypeScript Developer",
            "job_description": "Me chame no DM para conversar sobre TypeScript.",
            "poster_profile_url": "https://www.linkedin.com/in/recruiter-example",
            "source_evidence": "Me chame no DM para conversar sobre TypeScript.",
        },
        ["typescript"],
    )

    assert parsed["contact_channel_type"] == "linkedin"
    assert parsed["contact_channel_value"] == "https://www.linkedin.com/in/recruiter-example"
    assert parsed["contact_priority"] == "secondary"


def test_detects_english_contact_invitation_phrases() -> None:
    assert invites_linkedin_dm("We're hiring a TypeScript developer, DM me for details.")
    assert invites_linkedin_dm("Send your CV via LinkedIn if this role sounds interesting.")
    assert invites_linkedin_dm("Reach out to me if you have React experience.")


def test_detects_portuguese_contact_invitation_phrases() -> None:
    assert invites_linkedin_dm("Estamos contratando, me chama no inbox.")
    assert invites_linkedin_dm("Envie mensagem para conversar sobre a vaga.")
    assert invites_linkedin_dm("Fale comigo se voce trabalha com TypeScript.")


def test_does_not_treat_profile_link_without_contact_invitation_as_linkedin_contact() -> None:
    parsed = parse_candidate(
        {
            "post_headline": "Hiring TypeScript Developer",
            "job_description": "We use TypeScript and React.",
            "poster_profile_url": "https://www.linkedin.com/in/recruiter-example",
            "source_evidence": "We use TypeScript and React.",
        },
        ["typescript"],
    )

    assert parsed["contact_channel_type"] == ""
    assert parsed["contact_channel_value"] == ""
