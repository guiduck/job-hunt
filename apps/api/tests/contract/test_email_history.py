from app.models.email import OutreachEvent


def test_email_history_returns_events(client, db_session, review_ready_job_payload: dict[str, object]) -> None:
    opportunity = client.post("/opportunities", json=review_ready_job_payload).json()
    event = OutreachEvent(
        opportunity_id=opportunity["id"],
        event_type="failed",
        recipient_email="jobs@example.com",
        status="failed",
        error_message="Provider failed",
    )
    db_session.add(event)
    db_session.commit()

    response = client.get(f"/opportunities/{opportunity['id']}/email-history")

    assert response.status_code == 200
    assert response.json()[0]["status"] == "failed"
