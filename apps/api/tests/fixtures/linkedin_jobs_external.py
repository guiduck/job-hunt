def linkedin_jobs_external_run_payload(**overrides):
    payload = {
        "search_text": "typescript remote backend",
        "search_mode": "classic_keywords",
        "query_terms": ["typescript", "remote", "backend"],
        "date_posted": "past_week",
        "sort": "most_recent",
        "selected_source_keys": ["ashby", "lever"],
        "max_pages": 1,
        "assisted_search_enabled": False,
    }
    payload.update(overrides)
    return payload


def linkedin_jobs_external_candidate_payload(**overrides):
    payload = {
        "linkedin_job_url": "https://www.linkedin.com/jobs/view/123",
        "job_title": "Senior Backend Engineer",
        "company_name": "Example Co",
        "location_text": "Brazil Remote",
        "apply_button_kind": "external",
        "raw_apply_href": "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc",
        "decoded_apply_url": "https://jobs.ashbyhq.com/example/abc",
        "canonical_apply_url": "https://jobs.ashbyhq.com/example/abc",
        "source_key": "ashby",
        "outcome": "accepted",
        "page_number": 1,
        "position_on_page": 1,
    }
    payload.update(overrides)
    return payload