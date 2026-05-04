from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.api.errors import unauthorized
from app.db.session import get_db
from app.models.user import User
from app.services.auth_session_service import get_session_user


def bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise unauthorized()
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized("Invalid authorization header")
    return token


def current_user(db: Session = Depends(get_db), token: str = Depends(bearer_token)) -> User:
    user = get_session_user(db, token)
    if not user:
        raise unauthorized("Invalid or expired session")
    return user
