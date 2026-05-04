from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import text

from app.services import email_delivery


def test_worker_selects_provider_account_by_send_request_owner(db_session):
    now = datetime.now(UTC)
    user_a = "user-a"
    user_b = "user-b"
    db_session.execute(
        text(
            """
            INSERT INTO sending_provider_accounts (
              id, user_id, provider_name, auth_status, send_limit_per_day, token_json, created_at, updated_at
            )
            VALUES
              (:id_a, :user_a, 'gmail', 'authorized', 25, '{"owner":"a"}', :now, :now),
              (:id_b, :user_b, 'gmail', 'authorized', 25, '{"owner":"b"}', :now, :now)
            """
        ),
        {"id_a": str(uuid4()), "id_b": str(uuid4()), "user_a": user_a, "user_b": user_b, "now": now},
    )

    assert email_delivery._load_gmail_token_info(db_session, user_a) == {"owner": "a"}
    assert email_delivery._load_gmail_token_info(db_session, user_b) == {"owner": "b"}
