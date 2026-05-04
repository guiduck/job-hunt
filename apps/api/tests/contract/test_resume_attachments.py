from fastapi.testclient import TestClient


def test_create_list_and_deactivate_resume(client: TestClient) -> None:
    payload = {
        "display_name": "Main CV",
        "file_name": "cv.pdf",
        "file_path": ".local/resumes/cv.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 1234,
        "sha256": "a" * 64,
    }
    created = client.post("/user-settings/resumes", json=payload)
    assert created.status_code == 201

    listed = client.get("/user-settings/resumes")
    assert listed.status_code == 200
    assert listed.json()[0]["display_name"] == "Main CV"

    updated = client.patch(f"/user-settings/resumes/{created.json()['id']}", json={"is_available": False})
    assert updated.status_code == 200
    assert updated.json()["is_available"] is False


def test_upload_pdf_resume_download_and_set_default(client: TestClient) -> None:
    uploaded = client.post(
        "/user-settings/resumes/upload",
        data={"display_name": "Uploaded CV"},
        files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert uploaded.status_code == 201
    resume = uploaded.json()
    assert resume["display_name"] == "Uploaded CV"
    assert resume["mime_type"] == "application/pdf"
    assert resume["is_default"] is False

    defaulted = client.patch(f"/user-settings/resumes/{resume['id']}", json={"is_default": True})
    assert defaulted.status_code == 200
    assert defaulted.json()["is_default"] is True

    file_response = client.get(f"/user-settings/resumes/{resume['id']}/file")
    assert file_response.status_code == 200
    assert file_response.headers["content-type"] == "application/pdf"
    assert file_response.content == b"%PDF-1.4 test"
