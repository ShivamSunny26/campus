import uuid

from tests.conftest import listing_payload, unique_category


def test_create_listing_returns_201(client, register_user):
    account = register_user()
    category = unique_category()
    resp = client.post(
        "/api/v1/listings", json=listing_payload(category), headers=account["headers"]
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Api test item"
    assert body["seller_id"] == account["user"]["id"]
    assert body["status"] == "active"
    assert body["category"] == category
    assert float(body["price"]) == 12.5


def test_create_listing_requires_auth(client):
    resp = client.post("/api/v1/listings", json=listing_payload(unique_category()))
    assert resp.status_code in (401, 403)


def test_create_listing_validation_error(client, register_user):
    account = register_user()
    payload = listing_payload(unique_category())
    payload["price"] = "0"
    resp = client.post("/api/v1/listings", json=payload, headers=account["headers"])
    assert resp.status_code == 422


def test_list_listings_filters_by_category(client, register_user):
    account = register_user()
    category = unique_category()
    created = client.post(
        "/api/v1/listings", json=listing_payload(category), headers=account["headers"]
    ).json()

    resp = client.get("/api/v1/listings", params={"category": category})
    assert resp.status_code == 200
    assert [item["id"] for item in resp.json()] == [created["id"]]

    empty = client.get("/api/v1/listings", params={"category": unique_category()})
    assert empty.status_code == 200
    assert empty.json() == []


def test_list_listings_is_public(client):
    resp = client.get("/api/v1/listings", params={"limit": 5})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_listings_rejects_limit_above_50(client):
    resp = client.get("/api/v1/listings", params={"limit": 51})
    assert resp.status_code == 422


def test_get_listing_by_id(client, register_user):
    account = register_user()
    category = unique_category()
    created = client.post(
        "/api/v1/listings", json=listing_payload(category), headers=account["headers"]
    ).json()

    resp = client.get(f"/api/v1/listings/{created['id']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == created["id"]
    assert body["title"] == "Api test item"


def test_get_listing_not_found(client):
    resp = client.get(f"/api/v1/listings/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_get_listing_invalid_uuid_returns_422(client):
    resp = client.get("/api/v1/listings/not-a-uuid")
    assert resp.status_code == 422


def test_update_listing_by_owner(client, register_user):
    account = register_user()
    category = unique_category()
    created = client.post(
        "/api/v1/listings", json=listing_payload(category), headers=account["headers"]
    ).json()

    payload = listing_payload(category)
    payload["title"] = "Updated api test title"
    resp = client.patch(
        f"/api/v1/listings/{created['id']}", json=payload, headers=account["headers"]
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated api test title"


def test_update_listing_forbidden_for_non_owner(client, register_user):
    owner = register_user()
    intruder = register_user()
    created = client.post(
        "/api/v1/listings",
        json=listing_payload(unique_category()),
        headers=owner["headers"],
    ).json()

    resp = client.patch(
        f"/api/v1/listings/{created['id']}",
        json=listing_payload(unique_category()),
        headers=intruder["headers"],
    )
    assert resp.status_code == 403


def test_update_listing_not_found(client, register_user):
    account = register_user()
    resp = client.patch(
        f"/api/v1/listings/{uuid.uuid4()}",
        json=listing_payload(unique_category()),
        headers=account["headers"],
    )
    assert resp.status_code == 404


def test_delete_listing_by_owner_hides_it(client, register_user):
    account = register_user()
    category = unique_category()
    created = client.post(
        "/api/v1/listings", json=listing_payload(category), headers=account["headers"]
    ).json()

    resp = client.delete(f"/api/v1/listings/{created['id']}", headers=account["headers"])
    assert resp.status_code == 204

    assert client.get(f"/api/v1/listings/{created['id']}").status_code == 404
    listed = client.get("/api/v1/listings", params={"category": category})
    assert listed.json() == []


def test_delete_listing_forbidden_for_non_owner(client, register_user):
    owner = register_user()
    intruder = register_user()
    created = client.post(
        "/api/v1/listings",
        json=listing_payload(unique_category()),
        headers=owner["headers"],
    ).json()

    resp = client.delete(f"/api/v1/listings/{created['id']}", headers=intruder["headers"])
    assert resp.status_code == 403


def test_delete_listing_requires_auth(client, register_user):
    account = register_user()
    created = client.post(
        "/api/v1/listings",
        json=listing_payload(unique_category()),
        headers=account["headers"],
    ).json()

    resp = client.delete(f"/api/v1/listings/{created['id']}")
    assert resp.status_code in (401, 403)
