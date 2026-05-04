from typing import TypeVar

from sqlalchemy.orm import Query

from app.models.user import User

T = TypeVar("T")


def owned_query(query: Query[T], model: type[T], user: User) -> Query[T]:
    return query.filter(model.user_id == user.id)


def is_owned(record: object | None, user: User) -> bool:
    return bool(record is not None and getattr(record, "user_id", None) == user.id)


def assign_owner(record: object, user: User) -> object:
    setattr(record, "user_id", user.id)
    return record
