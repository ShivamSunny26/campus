# Security Design

## Authentication

### Passwords
Argon2 is used through `pwdlib`. Passwords are never reversible.

### Access token
Short-lived JWT:
- subject = user UUID
- role
- token type
- issued-at
- expiry
- random JTI

The frontend should keep the access token in memory where practical.

### Refresh token
The refresh token is a high-entropy opaque secret.

Only:

`SHA-256(refresh_token)`

is stored in PostgreSQL.

Refresh rotation:
`old token -> revoked -> new token`

If reuse detection is later required, a token-family table can be added.

## Authorization

Never trust a user ID supplied by the frontend.

The authenticated identity comes from the access token.

Ownership example:

```text
current_user.id == listing.seller_id
```

Admin/moderator operations use explicit server-side roles.

## Rate limiting

Redis is used for login/register throttling.

Production should additionally rate-limit:
- password reset
- message spam
- listing creation
- offer creation
- report creation
- upload initiation

## Chat security

Every message must verify:
1. access token
2. conversation membership
3. sender account is active
4. body length/type
5. attachment authorization if present

WebSocket connections should authenticate before joining a conversation.

## Upload security

Do not trust:
- filename
- extension
- client MIME type

Recommended production flow:
1. API authenticates user.
2. API creates a short-lived upload intent.
3. Client uploads directly to object storage.
4. Backend verifies metadata and ownership.
5. Backend associates object key with listing/message.
6. Virus/malware scanning runs asynchronously for user-uploaded files.

## Database security

Use:
- separate application DB user
- least privilege
- TLS in hosted environments
- connection pooling
- encrypted backups
- migration-only schema changes

Do not use a PostgreSQL superuser from FastAPI.

## Logging

Never log:
- passwords
- access tokens
- refresh tokens
- authorization headers
- private message bodies

Audit security events instead.

## Production hardening checklist

- [ ] HTTPS only
- [ ] Secure proxy configuration
- [ ] Strong secret manager
- [ ] PostgreSQL TLS
- [ ] Redis authentication/TLS
- [ ] strict production CORS
- [ ] trusted-host validation
- [ ] object-storage private buckets
- [ ] antivirus scanning
- [ ] backup + restore test
- [ ] monitoring/alerting
- [ ] dependency scanning
- [ ] container image scanning
- [ ] penetration test before public launch
