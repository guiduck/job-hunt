from fastapi.testclient import TestClient


def test_run_list_accepts_provider_status_filter(client: TestClient) -> None:
    response = client.get("/job-search-runs?provider_status=blocked")

    assert response.status_code == 200
    assert response.json() == []
