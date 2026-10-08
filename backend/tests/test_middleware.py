from app.core.config import settings


def test_security_headers_on_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert (
        resp.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"
    )
    assert resp.headers["Cache-Control"] == "public, max-age=60"


def test_security_headers_on_api_routes(client):
    resp = client.get("/api/v1/listings", params={"limit": 1})
    assert resp.status_code == 200
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["Cache-Control"] == "no-store"


def test_cors_allows_allowlisted_origin(client):
    origin = settings.CORS_ORIGINS[0]
    resp = client.get("/health", headers={"Origin": origin})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == origin


def test_cors_blocks_unknown_origin(client):
    resp = client.get("/health", headers={"Origin": "https://evil.example"})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") is None


def test_cors_preflight_allows_authorization_header(client):
    origin = settings.CORS_ORIGINS[0]
    resp = client.options(
        "/api/v1/listings",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == origin
    assert (
        "authorization" in resp.headers.get("access-control-allow-headers", "").lower()
    )


def test_cors_preflight_rejects_unknown_origin(client):
    resp = client.options(
        "/api/v1/listings",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 400
