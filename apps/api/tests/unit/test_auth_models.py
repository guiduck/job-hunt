from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import AuthSession, GoogleIdentityLink, PasswordResetRequest, User
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


def test_google_identity_link_persists_on_user(db_session):
    user = User(
        email="google-user@example.com",
        password_hash="hashed",
        display_name="Google User",
    )
    db_session.add(user)
    db_session.flush()

    link = GoogleIdentityLink(
        user_id=user.id,
        provider_subject="google-subject-123",
        email="google-user@example.com",
        email_verified=True,
        display_name="Google User",
    )
    db_session.add(link)
    db_session.commit()

    assert user.google_identity_links[0].provider == "google"
    assert user.google_identity_links[0].provider_subject == "google-subject-123"


def test_google_identity_link_provider_subject_is_unique(db_session):
    first_user = User(email="first@example.com", password_hash="hashed", display_name="First")
    second_user = User(email="second@example.com", password_hash="hashed", display_name="Second")
    db_session.add_all([first_user, second_user])
    db_session.flush()

    db_session.add(
        GoogleIdentityLink(
            user_id=first_user.id,
            provider_subject="same-google-subject",
            email="first@example.com",
        )
    )
    db_session.commit()

    db_session.add(
        GoogleIdentityLink(
            user_id=second_user.id,
            provider_subject="same-google-subject",
            email="second@example.com",
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
