from datetime import UTC, datetime, timedelta

from app.services.auth_service import create_user
from app.services.auth_session_service import create_session, get_session_user, revoke_session


def test_session_logout_revokes_access(db_session):
    user = create_user(db_session, email="session@example.com", password="Password123!", display_name="Session User")
    _, token = create_session(db_session, user)

    assert get_session_user(db_session, token).id == user.id

    revoke_session(db_session, token)

    assert get_session_user(db_session, token) is None


def test_session_validation_accepts_timezone_aware_expiry(db_session):
    user = create_user(db_session, email="aware-session@example.com", password="Password123!", display_name="Aware User")
    session, token = create_session(db_session, user)
    session.expires_at = datetime.now(UTC) + timedelta(hours=1)
    db_session.commit()

    assert get_session_user(db_session, token).id == user.id
