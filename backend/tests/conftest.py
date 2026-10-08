import asyncio
import logging
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.core.config import settings
from app.db.session import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.marketplace import Listing
from app.models.user import RefreshSession, User
import main  # noqa: F401  (ASGI app under test)

settings.RATE_LIMIT_ENABLED = False
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine.Engine").setLevel(logging.WARNING)

TEST_EMAIL_TAG = "apitest+"
TEST_PASSWORD = "Apitest_password_123!"


def _ensure_tables():
    async def run():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    asyncio.run(run())


async def _cleanup_test_rows():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User.id).where(User.email.like(f"{TEST_EMAIL_TAG}%"))
        )
        user_ids = [row[0] for row in result]
        if user_ids:
            await session.execute(delete(Listing).where(Listing.seller_id.in_(user_ids)))
            await session.execute(delete(RefreshSession).where(RefreshSession.user_id.in_(user_ids)))
            await session.execute(delete(User).where(User.id.in_(user_ids)))
        await session.commit()
    await engine.dispose()


@pytest.fixture(scope="session")
def client():
    _ensure_tables()
    with TestClient(main.app) as test_client:
        yield test_client
    asyncio.run(_cleanup_test_rows())


@pytest.fixture()
def register_user(client):
    def _register(email: str | None = None, password: str = TEST_PASSWORD):
        email = email or f"{TEST_EMAIL_TAG}{uuid.uuid4().hex[:12]}@example.com"
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": "Api Test User",
                "campus_name": "Test Campus",
            },
        )
        assert resp.status_code == 201, resp.text
        user = resp.json()
        login = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login.status_code == 200, login.text
        tokens = login.json()
        return {
            "email": email,
            "password": password,
            "user": user,
            "access": tokens["access_token"],
            "refresh": tokens["refresh_token"],
            "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
        }

    return _register


def unique_category() -> str:
    return f"apitest-{uuid.uuid4().hex[:8]}"


def listing_payload(category: str) -> dict:
    return {
        "title": "Api test item",
        "description": "Listing created by the automated API test suite",
        "category": category,
        "price": "12.50",
        "pickup_location": "Campus main gate",
        "quantity": 2,
    }
