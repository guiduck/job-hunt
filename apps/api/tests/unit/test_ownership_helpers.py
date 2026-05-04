from app.models.user import User
from app.services.ownership import assign_owner, is_owned


class OwnedRecord:
    user_id: str | None = None


def test_assign_owner_and_is_owned():
    user = User(
        id="user-1",
        email="user@example.com",
        password_hash="hashed",
        display_name="User",
    )
    other = User(
        id="user-2",
        email="other@example.com",
        password_hash="hashed",
        display_name="Other",
    )
    record = OwnedRecord()

    assign_owner(record, user)

    assert record.user_id == "user-1"
    assert is_owned(record, user)
    assert not is_owned(record, other)
    assert not is_owned(None, user)
