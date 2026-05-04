from app.services.password_service import hash_password, verify_password


def test_password_hash_never_stores_plaintext():
    password_hash = hash_password("Password123!")

    assert password_hash != "Password123!"
    assert verify_password("Password123!", password_hash)
    assert not verify_password("wrong-password", password_hash)
