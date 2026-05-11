from fastapi.testclient import TestClient


def test_create_list_and_deactivate_resume(client: TestClient, auth_headers: dict[str, str]) -> None:
    payload = {
        "display_name": "Main CV",
        "file_name": "cv.pdf",
        "file_path": ".local/resumes/cv.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 1234,
        "sha256": "a" * 64,
    }
    created = client.post("/user-settings/resumes", headers=auth_headers, json=payload)
    assert created.status_code == 201

    listed = client.get("/user-settings/resumes", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()[0]["display_name"] == "Main CV"

    updated = client.patch(f"/user-settings/resumes/{created.json()['id']}", headers=auth_headers, json={"is_available": False})
    assert updated.status_code == 200
    assert updated.json()["is_available"] is False

    assistant_context = client.patch(
        f"/user-settings/resumes/{created.json()['id']}",
        headers=auth_headers,
        json={"include_in_field_assistant_context": True, "is_available": True},
    )
    assert assistant_context.status_code == 200
    assert assistant_context.json()["include_in_field_assistant_context"] is True


def test_upload_pdf_resume_download_and_set_default(client: TestClient, auth_headers: dict[str, str]) -> None:
    uploaded = client.post(
        "/user-settings/resumes/upload",
        headers=auth_headers,
        data={"display_name": "Uploaded CV"},
        files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert uploaded.status_code == 201
    resume = uploaded.json()
    assert resume["display_name"] == "Uploaded CV"
    assert resume["mime_type"] == "application/pdf"
    assert resume["is_default"] is False

    defaulted = client.patch(f"/user-settings/resumes/{resume['id']}", headers=auth_headers, json={"is_default": True})
    assert defaulted.status_code == 200
    assert defaulted.json()["is_default"] is True

    file_response = client.get(f"/user-settings/resumes/{resume['id']}/file", headers=auth_headers)
    assert file_response.status_code == 200
    assert file_response.headers["content-type"] == "application/pdf"
    assert file_response.content == b"%PDF-1.4 test"
