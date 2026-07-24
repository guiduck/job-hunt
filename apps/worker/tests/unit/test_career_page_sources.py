from app.services.career_page_sources import active_source_keys, list_curated_career_sources, match_curated_source, validate_source_keys


def test_curated_source_registry_active_defaults_and_teamtailor_gate() -> None:
    sources = list_curated_career_sources()
    keys = {source["key"] for source in sources}

    assert {"inhire", "ashby", "lever", "greenhouse", "smartrecruiters", "trampos", "catho", "teamtailor"} <= keys
    assert "teamtailor" not in active_source_keys()
    assert validate_source_keys(None) == ["inhire", "ashby", "lever", "greenhouse", "smartrecruiters", "trampos", "catho"]
    assert match_curated_source("https://jobs.ashbyhq.com/example/abc", ["ashby"]).key == "ashby"
    assert match_curated_source("https://jobs.teamtailor.com/example/abc", ["teamtailor"]) is None