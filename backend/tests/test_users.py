def test_users_me_returns_profile(client, register_user):
    account = register_user()
    resp = client.get("/api/v1/users/me", headers=account["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == account["email"]
    assert body["id"] == account["user"]["id"]
    assert body["campus_name"] == "Test Campus"


def test_users_me_requires_authentication(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code in (401, 403)


def test_users_me_rejects_invalid_token(client):
    resp = client.get("/api/v1/users/me", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 401
