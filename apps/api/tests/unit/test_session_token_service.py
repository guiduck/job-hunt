from app.services.session_token_service import generate_token, hash_token


def test_generated_tokens_are_hashable_and_distinct():
    first = generate_token()
    second = generate_token()

    assert first != second
    assert hash_token(first) == hash_token(first)
    assert hash_token(first) != first
    assert hash_token(first) != hash_token(second)
