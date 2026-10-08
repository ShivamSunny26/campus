import json

from app.core.config import settings

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}

EXPECTED_PATHS = {
    "/health": {"get"},
    "/api/v1/auth/register": {"post"},
    "/api/v1/auth/login": {"post"},
    "/api/v1/auth/refresh": {"post"},
    "/api/v1/auth/logout": {"post"},
    "/api/v1/auth/me": {"get"},
    "/api/v1/users/me": {"get"},
    "/api/v1/listings": {"get", "post"},
    "/api/v1/listings/{listing_id}": {"get", "patch", "delete"},
}


def _spec(client) -> dict:
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    return resp.json()


def test_openapi_declares_every_endpoint(client):
    paths = _spec(client)["paths"]
    actual = {
        path: {method for method in operations if method in HTTP_METHODS}
        for path, operations in paths.items()
    }
    assert actual == EXPECTED_PATHS


def test_openapi_document_metadata(client):
    info = _spec(client)["info"]
    assert info["title"] == settings.APP_NAME
    assert info["version"] == "1.0.0"


def test_openapi_never_documents_password_hashes(client):
    spec = json.dumps(_spec(client))
    assert "password_hash" not in spec
    assert "token_hash" not in spec
