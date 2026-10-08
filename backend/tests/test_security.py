from datetime import datetime, timedelta, timezone
import uuid

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


def test_password_hash_round_trip():
    raw = "A_very_strong_password_123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed)
    assert not verify_password("wrong", hashed)


def test_password_hash_uses_argon2():
    hashed = hash_password("A_very_strong_password_123!")
    assert hashed.startswith("$argon2")


def test_password_hash_is_salted_per_call():
    raw = "A_very_strong_password_123!"
    first = hash_password(raw)
    second = hash_password(raw)
    assert first != second
    assert verify_password(raw, first)
    assert verify_password(raw, second)


def test_access_token_claims():
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id, "student")
    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "student"
    assert payload["type"] == "access"
    assert payload["jti"]
    assert payload["exp"] > payload["iat"]
    assert datetime.fromtimestamp(payload["exp"], tz=timezone.utc) <= (
        datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES + 1)
    )


def test_access_token_rejects_tampered_token():
    token = create_access_token(str(uuid.uuid4()), "student")
    header, payload_b64, signature = token.split(".")
    index = len(payload_b64) // 2
    replacement = "A" if payload_b64[index] != "A" else "B"
    tampered = f"{header}.{payload_b64[:index]}{replacement}{payload_b64[index + 1 :]}.{signature}"
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(tampered)


def test_access_token_rejects_other_secret():
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "admin",
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=5),
        "jti": uuid.uuid4().hex,
    }
    forged = jwt.encode(
        payload, "a_completely_different_secret_key_value", algorithm=settings.ALGORITHM
    )
    with pytest.raises(jwt.InvalidSignatureError):
        decode_access_token(forged)


def test_access_token_rejects_expired_token():
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "student",
        "type": "access",
        "iat": now - timedelta(hours=1),
        "exp": now - timedelta(minutes=1),
        "jti": uuid.uuid4().hex,
    }
    expired = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired)


def test_refresh_token_is_not_stored_raw():
    token = create_refresh_token()
    assert len(token) > 40
    assert hash_refresh_token(token) != token
    assert len(hash_refresh_token(token)) == 64


def test_refresh_tokens_are_unique():
    tokens = {create_refresh_token() for _ in range(5)}
    assert len(tokens) == 5


def test_hash_refresh_token_is_deterministic_hex():
    token = create_refresh_token()
    digest = hash_refresh_token(token)
    assert digest == hash_refresh_token(token)
    assert digest == digest.lower()
    assert len(set(digest)) > 1
    assert all(char in "0123456789abcdef" for char in digest)
