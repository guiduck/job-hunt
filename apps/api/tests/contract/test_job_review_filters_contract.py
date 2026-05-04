from fastapi.testclient import TestClient


def test_opportunities_accept_review_filter_query_params(client: TestClient) -> None:
    response = client.get(
        "/opportunities",
        params={
            "opportunity_type": "job",
            "min_score": 60,
            "matched_keyword": "typescript",
            "contact_available": True,
            "review_status": "unreviewed",
            "analysis_status": "deterministic_only",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
