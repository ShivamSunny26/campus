# Campus Hustle Backend

Production-oriented FastAPI backend foundation for the Campus Hustle marketplace.

## Stack

- Python 3.12+
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x async ORM
- Alembic migrations
- Pydantic v2 / pydantic-settings
- JWT access tokens
- Rotating refresh tokens stored as hashes
- Argon2 password hashing
- Redis-backed rate-limit hook
- CORS allowlist
- Security headers
- Structured audit events
- Role-based access control
- WebSocket-ready architecture for chat
- Pytest test foundation

## Security model

1. Passwords are never stored directly; Argon2 hashes are stored.
2. Access tokens are short-lived.
3. Refresh tokens are random opaque tokens. Only their SHA-256 hashes are stored.
4. Refresh-token rotation revokes the previous session token.
5. Login/register endpoints are rate-limited through Redis when Redis is enabled.
6. Request bodies use Pydantic validation.
7. SQLAlchemy parameters prevent SQL injection from application queries.
8. CORS is configured through an explicit allowlist.
9. Security headers are applied by middleware.
10. Audit events record security-sensitive actions.
11. User roles are enforced server-side.
12. Marketplace ownership is checked before mutations.
13. Message endpoints require conversation membership.
14. Uploads are represented by metadata first; do not trust client MIME/type or filenames in a future object-storage implementation.
15. Production secrets are environment variables, never committed.

This is a strong application foundation, not a claim of formal security certification.

## Quick start

### 1. Create environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set a strong `SECRET_KEY`. The backend reads `ENVIRONMENT`, `SUPABASE_DATABASE_URL`, `ALLOWED_ORIGINS`, `REDIS_HOST`/`REDIS_PORT`/`REDIS_USER`/`REDIS_PASSWORD`, and `SECRET_KEY` from it.

### 2. Database

The app connects to the database configured in `SUPABASE_DATABASE_URL`. To use local PostgreSQL + Redis instead, point `SUPABASE_DATABASE_URL` at it and run:

```powershell
docker compose up -d postgres redis
```

### 3. Run migrations

```powershell
alembic upgrade head
```

### 4. Start API

```powershell
fastapi dev main.py
# or
uvicorn main:app --reload
```

Open `/docs` during development.

## API groups

- `/api/v1/auth` — register/login/refresh/logout
- `/api/v1/users` — current profile
- `/api/v1/listings` — marketplace listings
- `/api/v1/favorites` — saved listings
- `/api/v1/conversations` — chat conversations
- `/api/v1/conversations/{id}/messages` — messages
- `/api/v1/offers` — bargaining offers
- `/api/v1/deals` — accepted deals
- `/api/v1/reports` — abuse/safety reports
- `/api/v1/seller` — seller dashboard data
- `/health` — health check

## Database design

See `docs/database_design.md` and `docs/schema.sql`.

Main relationship:

`User -> Listing -> Conversation -> Message`

Bargaining:

`Conversation -> Offer -> Deal`

Trust:

`User -> Review`, `User -> Report`, `User -> AuditEvent`

Authentication:

`User -> RefreshSession`

## Development rules

- Never return password hashes.
- Never log access/refresh tokens.
- Never trust `user_id` from the request body for ownership.
- Derive current user from the authenticated token.
- Use database transactions for deal/offer state changes.
- Use pagination for marketplace and messages.
- Keep WebSocket authentication separate from HTTP authorization logic.
