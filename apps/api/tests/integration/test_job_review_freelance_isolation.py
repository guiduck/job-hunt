from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.opportunity import Opportunity

from tests.integration.test_job_review_filters import make_payload


def test_full_time_filters_exclude_freelance_records(client: TestClient, db_session: Session) -> None:
    client.post("/opportunities", json=make_payload("TypeScript Developer", "typescript@example.com", ["typescript"], 80))
    db_session.add(
        Opportunity(
            opportunity_type="freelance",
            title="Freelance Lead",
            organization_name="Lead Co",
            source_name="Manual",
            source_evidence="Manual freelance prospect",
        )
    )
    db_session.commit()

    response = client.get("/opportunities", params={"opportunity_type": "job", "min_score": 1})

    assert response.status_code == 200
    assert [item["opportunity_type"] for item in response.json()] == ["job"]
