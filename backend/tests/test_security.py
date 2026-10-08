from app.core.security import hash_password, verify_password, create_refresh_token, hash_refresh_token

def test_password_hash_round_trip():
    raw = "A_very_strong_password_123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed)
    assert not verify_password("wrong", hashed)

def test_refresh_token_is_not_stored_raw():
    token = create_refresh_token()
    assert len(token) > 40
    assert hash_refresh_token(token) != token
    assert len(hash_refresh_token(token)) == 64
