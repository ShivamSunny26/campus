from app.core.config import settings


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"status", "service"}
    assert body["status"] == "ok"
    assert body["service"] == settings.APP_NAME


def test_health_endpoint_is_reachable_without_auth(client):
    resp = client.get("/health", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 200
