from fastapi.testclient import TestClient

from tests.integration.test_job_opportunity_storage import sample_payload


def test_job_only_filter_and_contact_filter(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/opportunities", json=sample_payload(), headers=auth_headers)

    response = client.get("/opportunities?opportunity_type=job&contact_channel=jobs@example.com&matched_keyword=reactjs", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["opportunity_type"] == "job"
    assert body[0]["job_detail"]["contact_channel_value"] == "jobs@example.com"


def test_keyword_filter_searches_job_description(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/opportunities", json=sample_payload(), headers=auth_headers)

    response = client.get("/opportunities?opportunity_type=job&keyword=Next.js", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["job_detail"]["job_description"] == "We use React, TypeScript, and Next.js."


def test_keyword_filter_searches_contact_email(client: TestClient, auth_headers: dict[str, str]) -> None:
    payload = sample_payload()
    payload["job_detail"]["contact_channel_type"] = "linkedin"
    payload["job_detail"]["contact_channel_value"] = "https://www.linkedin.com/in/recruiter-example"
    payload["job_detail"]["contact_email"] = "apply@example.com"
    client.post("/opportunities", json=payload, headers=auth_headers)

    response = client.get("/opportunities?opportunity_type=job&keyword=apply@example.com", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["job_detail"]["contact_email"] == "apply@example.com"


def test_paginated_filters_preserve_search_and_sort(client: TestClient, auth_headers: dict[str, str]) -> None:
    for index in range(3):
        payload = sample_payload()
        payload["title"] = f"React Engineer {index}"
        payload["organization_name"] = f"Example {index}"
        payload["source_url"] = f"https://www.linkedin.com/feed/update/paginated-{index}"
        payload["source_evidence"] = f"Example {index} is hiring React engineers. Email jobs{index}@example.com."
        payload["job_detail"]["company_name"] = f"Example {index}"
        payload["job_detail"]["role_title"] = f"React Engineer {index}"
        payload["job_detail"]["post_headline"] = f"Hiring React Engineer {index}"
        payload["job_detail"]["contact_channel_value"] = f"jobs{index}@example.com"
        payload["job_detail"]["contact_email"] = f"jobs{index}@example.com"
        client.post("/opportunities", json=payload, headers=auth_headers)

    first_page = client.get(
        "/opportunities?opportunity_type=job&keyword=React&page=1&page_size=2&sort_order=oldest",
        headers=auth_headers,
    )
    second_page = client.get(
        "/opportunities?opportunity_type=job&keyword=React&page=2&page_size=2&sort_order=oldest",
        headers=auth_headers,
    )
    corrected_page = client.get(
        "/opportunities?opportunity_type=job&keyword=React&page=99&page_size=2&sort_order=oldest",
        headers=auth_headers,
    )

    assert first_page.status_code == 200
    first_body = first_page.json()
    assert first_body["page"] == 1
    assert first_body["page_size"] == 2
    assert first_body["total_items"] == 3
    assert first_body["total_pages"] == 2
    assert first_body["has_next"] is True
    assert len(first_body["items"]) == 2

    second_body = second_page.json()
    assert second_body["page"] == 2
    assert second_body["has_previous"] is True
    assert len(second_body["items"]) == 1

    assert corrected_page.json()["page"] == 2
