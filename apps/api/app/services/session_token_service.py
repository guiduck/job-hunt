import hashlib
import secrets

from app.core.config import get_settings


def generate_token(byte_count: int | None = None) -> str:
    size = byte_count or get_settings().auth_token_bytes
    return secrets.token_urlsafe(size)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
