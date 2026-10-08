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


def test_openapi_declares_every_endpoint(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    paths = resp.json()["paths"]
    actual = {
        path: {method for method in operations if method in HTTP_METHODS}
        for path, operations in paths.items()
    }
    assert actual == EXPECTED_PATHS
