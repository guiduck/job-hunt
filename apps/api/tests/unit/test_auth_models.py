from datetime import UTC, datetime, timedelta

from app.models.user import AuthSession, PasswordResetRequest, User
from app.services.session_token_service import hash_token


def test_user_auth_models_persist_relationships(db_session):
    user = User(
        email="person@example.com",
        password_hash="hashed",
        display_name="Person",
    )
    db_session.add(user)
    db_session.flush()

    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token("session-token"),
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )
    reset = PasswordResetRequest(
        user_id=user.id,
        token_hash=hash_token("reset-token"),
        requested_email=user.email,
        expires_at=datetime.now(UTC) + timedelta(minutes=30),
    )
    db_session.add_all([session, reset])
    db_session.commit()

    assert user.sessions[0].token_hash == hash_token("session-token")
    assert user.password_reset_requests[0].requested_email == "person@example.com"
