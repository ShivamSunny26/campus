def test_users_me_returns_profile(client, register_user):
    account = register_user()
    resp = client.get("/api/v1/users/me", headers=account["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {
        "id",
        "email",
        "full_name",
        "campus_name",
        "role",
        "campus_verified",
    }
    assert body["email"] == account["email"]
    assert body["id"] == account["user"]["id"]
    assert body["campus_name"] == "Test Campus"
    assert body["role"] == "student"
    assert body["campus_verified"] is False


def test_users_me_never_returns_credentials(client, register_user):
    account = register_user()
    resp = client.get("/api/v1/users/me", headers=account["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert "password_hash" not in body
    assert "password" not in body
    assert "is_banned" not in body


def test_users_me_requires_authentication(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code in (401, 403)


def test_users_me_rejects_invalid_token(client):
    resp = client.get("/api/v1/users/me", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 401
