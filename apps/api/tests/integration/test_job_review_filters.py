from fastapi.testclient import TestClient


def make_payload(title: str, contact: str, keywords: list[str], score: int, review_status: str = "unreviewed") -> dict[str, object]:
    return {
        "opportunity_type": "job",
        "title": title,
        "organization_name": f"{title} Co",
        "source_name": "LinkedIn",
        "source_url": f"https://www.linkedin.com/feed/update/{title}",
        "source_query": "hiring typescript",
        "source_evidence": f"{title} role. Email {contact}",
        "job_detail": {
            "company_name": f"{title} Co",
            "role_title": title,
            "post_headline": title,
            "job_description": "TypeScript product role",
            "contact_channel_type": "email",
            "contact_channel_value": contact,
            "matched_keywords": keywords,
            "review_profile": {
                "review_status": review_status,
                "match_score": score,
                "score_explanation": "Seeded review score",
                "analysis_status": "deterministic_only",
                "score_factors": {"matched_keywords": keywords, "missing_keywords": []},
            },
        },
    }


def test_filters_by_score_keyword_contact_and_review_status(client: TestClient) -> None:
    client.post("/opportunities", json=make_payload("Senior TypeScript Developer", "senior@example.com", ["typescript"], 86))
    client.post("/opportunities", json=make_payload("Junior Python Developer", "junior@example.com", ["python"], 45))

    response = client.get(
        "/opportunities",
        params={
            "opportunity_type": "job",
            "min_score": 60,
            "matched_keyword": "typescript",
            "contact_available": True,
            "review_status": "unreviewed",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Senior TypeScript Developer"
