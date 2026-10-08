import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import settings
from tests.conftest import TEST_EMAIL_TAG, TEST_PASSWORD, set_user_fields


def _email() -> str:
    return f"{TEST_EMAIL_TAG}{uuid.uuid4().hex[:12]}@example.com"


def _register_payload(email: str, password: str = TEST_PASSWORD) -> dict:
    return {
        "email": email,
        "password": password,
        "full_name": "Api Test User",
        "campus_name": "Test Campus",
    }


def _signed_token(
    subject: str | None = None,
    *,
    role: str = "student",
    token_type: str = "access",
    secret: str | None = None,
    iat: datetime | None = None,
    exp: datetime | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject or str(uuid.uuid4()),
        "role": role,
        "type": token_type,
        "iat": iat or now - timedelta(minutes=1),
        "exp": exp or now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(
        payload, secret or settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )


def test_register_returns_user_without_password_hash(client):
    email = _email()
    resp = client.post("/api/v1/auth/register", json=_register_payload(email))
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == email
    assert body["role"] == "student"
    assert body["campus_verified"] is False
    assert set(body) == {
        "id",
        "email",
        "full_name",
        "campus_name",
        "role",
        "campus_verified",
    }


def test_register_duplicate_email_conflict(client, register_user):
    account = register_user()
    resp = client.post(
        "/api/v1/auth/register", json=_register_payload(account["email"])
    )
    assert resp.status_code == 409


def test_register_duplicate_email_is_case_insensitive(client, register_user):
    account = register_user()
    resp = client.post(
        "/api/v1/auth/register",
        json=_register_payload(account["email"].upper()),
    )
    assert resp.status_code == 409


def test_register_short_password_validation_error(client):
    resp = client.post(
        "/api/v1/auth/register", json=_register_payload(_email(), password="short")
    )
    assert resp.status_code == 422


def test_register_password_longer_than_128_rejected(client):
    resp = client.post(
        "/api/v1/auth/register",
        json=_register_payload(_email(), password="A" * 129),
    )
    assert resp.status_code == 422


def test_register_invalid_email_validation_error(client):
    resp = client.post("/api/v1/auth/register", json=_register_payload("not-an-email"))
    assert resp.status_code == 422


@pytest.mark.parametrize(
    "field,value",
    [
        ("full_name", "A"),
        ("campus_name", "B"),
        ("email", ""),
    ],
)
def test_register_missing_or_too_short_fields_rejected(client, field, value):
    payload = _register_payload(_email())
    payload[field] = value
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


def test_register_stores_email_lowercased(client):
    email = f"{TEST_EMAIL_TAG}{uuid.uuid4().hex[:12]}@Example.COM"
    resp = client.post("/api/v1/auth/register", json=_register_payload(email))
    assert resp.status_code == 201
    assert resp.json()["email"] == email.lower()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": email.upper(), "password": TEST_PASSWORD},
    )
    assert login.status_code == 200


def test_login_returns_token_pair(client, register_user):
    account = register_user()
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": account["email"], "password": account["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password_unauthorized(client, register_user):
    account = register_user()
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": account["email"], "password": "Wrong_password_123!"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_unauthorized(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": _email(), "password": TEST_PASSWORD},
    )
    assert resp.status_code == 401


def test_login_banned_account_forbidden(client, register_user):
    account = register_user()
    set_user_fields(account["user"]["id"], is_banned=True)
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": account["email"], "password": account["password"]},
    )
    assert resp.status_code == 403


def test_auth_me_returns_profile(client, register_user):
    account = register_user()
    resp = client.get("/api/v1/auth/me", headers=account["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == account["email"]
    assert body["id"] == account["user"]["id"]


def test_auth_me_without_token_rejected(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


def test_auth_me_garbage_token_rejected(client):
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert resp.status_code == 401


def test_auth_me_expired_token_rejected(client):
    token = _signed_token(exp=datetime.now(timezone.utc) - timedelta(minutes=5))
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_auth_me_rejects_refresh_type_token(client):
    token = _signed_token(token_type="refresh")
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_auth_me_rejects_token_signed_with_other_secret(client):
    token = _signed_token(secret="another_secret_key_that_is_long_enough_1234567890")
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_auth_me_rejects_token_for_unknown_user(client):
    token = _signed_token(str(uuid.uuid4()))
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


def test_auth_me_rejects_banned_user(client, register_user):
    account = register_user()
    set_user_fields(account["user"]["id"], is_banned=True)
    resp = client.get("/api/v1/auth/me", headers=account["headers"])
    assert resp.status_code == 401


def test_auth_me_rejects_deactivated_user(client, register_user):
    account = register_user()
    set_user_fields(account["user"]["id"], is_active=False)
    resp = client.get("/api/v1/auth/me", headers=account["headers"])
    assert resp.status_code == 401


def test_refresh_rotates_tokens(client, register_user):
    account = register_user()
    first = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": account["refresh"]}
    )
    assert first.status_code == 200
    rotated = first.json()
    assert rotated["refresh_token"] != account["refresh"]
    assert rotated["access_token"]

    reused = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": account["refresh"]}
    )
    assert reused.status_code == 401

    again = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": rotated["refresh_token"]}
    )
    assert again.status_code == 200


def test_logout_invalidates_refresh_token(client, register_user):
    account = register_user()
    resp = client.post(
        "/api/v1/auth/logout", params={"refresh_token": account["refresh"]}
    )
    assert resp.status_code == 204

    after = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": account["refresh"]}
    )
    assert after.status_code == 401


def test_logout_with_unknown_token_is_idempotent(client):
    resp = client.post(
        "/api/v1/auth/logout", params={"refresh_token": uuid.uuid4().hex}
    )
    assert resp.status_code == 204


def test_refresh_rejects_unknown_token(client):
    resp = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": uuid.uuid4().hex}
    )
    assert resp.status_code == 401
