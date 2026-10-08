import asyncio

import pytest
from fastapi import HTTPException

from app.core import rate_limit as rate_limit_module
from app.core.config import settings
from app.core.rate_limit import enforce_rate_limit
from tests.conftest import TEST_EMAIL_TAG, TEST_PASSWORD


class FakeRedis:
    def __init__(self, unavailable: bool = False):
        self.values: dict[str, int] = {}
        self.windows: dict[str, int] = {}
        self.unavailable = unavailable

    async def incr(self, key: str) -> int:
        if self.unavailable:
            raise ConnectionError("redis unavailable")
        self.values[key] = self.values.get(key, 0) + 1
        return self.values[key]

    async def expire(self, key: str, window: int) -> bool:
        if self.unavailable:
            raise ConnectionError("redis unavailable")
        self.windows[key] = window
        return True


def _enable(monkeypatch, fake) -> None:
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(rate_limit_module, "redis_client", fake)


def test_disabled_rate_limit_never_touches_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", False)
    monkeypatch.setattr(rate_limit_module, "redis_client", fake)

    asyncio.run(enforce_rate_limit("disabled-key", 1, 60))

    assert fake.values == {}
    assert fake.windows == {}


def test_rate_limit_allows_requests_up_to_the_limit(monkeypatch):
    fake = FakeRedis()
    _enable(monkeypatch, fake)

    for _ in range(3):
        asyncio.run(enforce_rate_limit("allowed-key", 3, 60))

    assert fake.values["allowed-key"] == 3
    assert fake.windows["allowed-key"] == 60


def test_rate_limit_blocks_request_over_the_limit(monkeypatch):
    fake = FakeRedis()
    _enable(monkeypatch, fake)

    for _ in range(3):
        asyncio.run(enforce_rate_limit("blocked-key", 3, 60))

    with pytest.raises(HTTPException) as excinfo:
        asyncio.run(enforce_rate_limit("blocked-key", 3, 60))

    assert excinfo.value.status_code == 429
    assert "Too many requests" in str(excinfo.value.detail)


def test_rate_limit_keeps_separate_counters_per_key(monkeypatch):
    fake = FakeRedis()
    _enable(monkeypatch, fake)

    for _ in range(3):
        asyncio.run(enforce_rate_limit("tenant-a", 3, 60))

    with pytest.raises(HTTPException):
        asyncio.run(enforce_rate_limit("tenant-a", 3, 60))

    asyncio.run(enforce_rate_limit("tenant-b", 3, 60))
    assert fake.values["tenant-b"] == 1


def test_rate_limit_falls_back_when_redis_is_unavailable(monkeypatch):
    fake = FakeRedis(unavailable=True)
    _enable(monkeypatch, fake)

    result = asyncio.run(enforce_rate_limit("unavailable-key", 1, 60))

    assert result is None


def test_register_endpoint_enforces_rate_limit(client, monkeypatch):
    fake = FakeRedis()
    _enable(monkeypatch, fake)

    payloads = [
        {
            "email": f"{TEST_EMAIL_TAG}rl{index}-{id(fake)}@example.com",
            "password": TEST_PASSWORD,
            "full_name": "Api Test User",
            "campus_name": "Test Campus",
        }
        for index in range(4)
    ]

    for payload in payloads[:3]:
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201, resp.text

    blocked = client.post("/api/v1/auth/register", json=payloads[3])
    assert blocked.status_code == 429

    register_keys = [key for key in fake.values if key.startswith("register:")]
    assert len(register_keys) == 1
    assert fake.values[register_keys[0]] == 4
