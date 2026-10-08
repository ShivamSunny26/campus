import uuid

from tests.conftest import TEST_EMAIL_TAG, TEST_PASSWORD


def _email() -> str:
    return f"{TEST_EMAIL_TAG}{uuid.uuid4().hex[:12]}@example.com"


def _register_payload(email: str, password: str = TEST_PASSWORD) -> dict:
    return {
        "email": email,
        "password": password,
        "full_name": "Api Test User",
        "campus_name": "Test Campus",
    }


def test_register_returns_user_without_password_hash(client):
    email = _email()
    resp = client.post("/api/v1/auth/register", json=_register_payload(email))
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == email
    assert body["role"] == "student"
    assert set(body) == {"id", "email", "full_name", "campus_name", "role", "campus_verified"}


def test_register_duplicate_email_conflict(client, register_user):
    account = register_user()
    resp = client.post("/api/v1/auth/register", json=_register_payload(account["email"]))
    assert resp.status_code == 409


def test_register_short_password_validation_error(client):
    resp = client.post("/api/v1/auth/register", json=_register_payload(_email(), password="short"))
    assert resp.status_code == 422


def test_register_invalid_email_validation_error(client):
    resp = client.post("/api/v1/auth/register", json=_register_payload("not-an-email"))
    assert resp.status_code == 422


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


def test_refresh_rotates_tokens(client, register_user):
    account = register_user()
    first = client.post("/api/v1/auth/refresh", params={"refresh_token": account["refresh"]})
    assert first.status_code == 200
    rotated = first.json()
    assert rotated["refresh_token"] != account["refresh"]
    assert rotated["access_token"]

    reused = client.post("/api/v1/auth/refresh", params={"refresh_token": account["refresh"]})
    assert reused.status_code == 401

    again = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": rotated["refresh_token"]}
    )
    assert again.status_code == 200


def test_logout_invalidates_refresh_token(client, register_user):
    account = register_user()
    resp = client.post("/api/v1/auth/logout", params={"refresh_token": account["refresh"]})
    assert resp.status_code == 204

    after = client.post("/api/v1/auth/refresh", params={"refresh_token": account["refresh"]})
    assert after.status_code == 401


def test_refresh_rejects_unknown_token(client):
    resp = client.post(
        "/api/v1/auth/refresh", params={"refresh_token": uuid.uuid4().hex}
    )
    assert resp.status_code == 401
