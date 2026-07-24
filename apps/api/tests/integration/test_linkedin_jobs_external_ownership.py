from fastapi.testclient import TestClient


def test_linkedin_jobs_external_owner_isolation(client: TestClient, auth_headers: dict[str, str], db_session) -> None:
    created = client.post(
        "/job-search-runs/linkedin-jobs-external",
        headers=auth_headers,
        json={"selected_source_keys": ["ashby"], "max_pages": 1},
    )
    assert created.status_code == 202, created.text
    run_id = created.json()["id"]

    other_register = client.post(
        "/auth/register",
        json={"email": "other@example.com", "password": "Password123!", "display_name": "Other User"},
    )
    assert other_register.status_code == 201, other_register.text
    other_headers = {"Authorization": f"Bearer {other_register.json()['access_token']}"}

    assert client.get(f"/job-search-runs/{run_id}", headers=other_headers).status_code == 404
    assert client.patch(
        f"/job-search-runs/linkedin-jobs-external/{run_id}",
        headers=other_headers,
        json={"status": "running", "pages_visited": 1},
    ).status_code == 404
    assert client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/candidates",
        headers=other_headers,
        json={"outcome": "skipped_easy_apply", "apply_button_kind": "easy_apply", "page_number": 1},
    ).status_code == 404
    assert client.post(
        f"/job-search-runs/linkedin-jobs-external/{run_id}/complete",
        headers=other_headers,
        json={"terminal_reason": "cancelled", "status": "cancelled"},
    ).status_code == 404