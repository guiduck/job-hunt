import bcrypt


MAX_BCRYPT_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:MAX_BCRYPT_PASSWORD_BYTES]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode("utf-8")[:MAX_BCRYPT_PASSWORD_BYTES]
    return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
