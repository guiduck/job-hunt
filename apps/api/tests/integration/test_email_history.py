from app.models.email import OutreachEvent


def test_history_ordering_and_failed_visibility(client, db_session, review_ready_job_payload: dict[str, object]) -> None:
    opportunity = client.post("/opportunities", json=review_ready_job_payload).json()
    db_session.add_all(
        [
            OutreachEvent(opportunity_id=opportunity["id"], event_type="sent", recipient_email="jobs@example.com", status="sent"),
            OutreachEvent(opportunity_id=opportunity["id"], event_type="failed", recipient_email="jobs@example.com", status="failed"),
        ]
    )
    db_session.commit()

    events = client.get(f"/opportunities/{opportunity['id']}/email-history").json()

    assert {event["status"] for event in events} == {"sent", "failed"}
