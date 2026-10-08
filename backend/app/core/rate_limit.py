from fastapi import HTTPException, status
from redis.asyncio import Redis
from app.core.config import settings

redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

async def enforce_rate_limit(key: str, limit: int, window: int):
    if not settings.RATE_LIMIT_ENABLED:
        return
    try:
        current = await redis_client.incr(key)
        if current == 1:
            await redis_client.expire(key, window)
        if current > limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Try again later.")
    except HTTPException:
        raise
    except Exception:
        # Availability-first fallback: if Redis is unavailable, the API remains usable.
        # Production deployments may choose fail-closed behavior for auth endpoints.
        return
