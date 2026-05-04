from app.services.auth_service import create_user
from app.services.password_reset_service import consume_password_reset, request_password_reset


def test_password_reset_token_is_single_use(db_session):
    create_user(db_session, email="reset@example.com", password="OldPassword123!", display_name="Reset User")

    token = request_password_reset(db_session, "reset@example.com")
    assert token

    user = consume_password_reset(db_session, token, "NewPassword123!")
    assert user is not None
    assert consume_password_reset(db_session, token, "AnotherPassword123!") is None
