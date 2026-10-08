# Campus Hustle Database Design

## Core entities

### users
One row per campus account.

Important fields:
- `email` unique
- `password_hash`
- `role`
- `campus_verified`
- `is_active`
- `is_banned`

### listings
The marketplace inventory.

`users (seller) 1 -> N listings`

A listing belongs to exactly one seller.

### listing_media
Images/files associated with listings.

`listings 1 -> N listing_media`

Only an object-storage key is stored in PostgreSQL. The actual image should live in S3-compatible storage/Supabase Storage/etc.

### favorites
Many-to-many between users and listings.

`users N <-> N listings`

The unique constraint prevents duplicate saves.

### conversations
A chat thread, optionally linked to a listing.

### conversation_members
Users participating in a conversation.

This is intentionally normalized instead of putting `buyer_id` and `seller_id` directly into the conversation so group messaging can be added later.

### messages
Messages belong to conversations and have a sender.

`conversation 1 -> N messages`

### offers
Every bargaining proposal is recorded separately.

Example:
- buyer: ₹500
- seller: ₹550
- buyer: ₹525
- seller accepts ₹525

This gives an auditable bargaining history.

### deals
A confirmed transaction created from a successful offer.

`listing -> deal`
`conversation -> deal`
`buyer -> deal`
`seller -> deal`

### reviews
A review can only be created for a completed/valid deal, and the database prevents one reviewer from reviewing the same deal twice.

### reports
Safety/moderation reports against a user or listing.

### audit_events
Security-sensitive and moderation events.

Examples:
- login success/failure
- refresh rotation
- listing deletion
- user ban
- report creation
- deal confirmation

### refresh_sessions
Server-side refresh-token sessions.

Only SHA-256 hashes of opaque refresh tokens are stored. This lets the server revoke sessions without storing bearer secrets.

## Relationship map

```text
                         ┌───────────────┐
                         │     users     │
                         └───────┬───────┘
                 ┌───────────────┼─────────────────┐
                 │               │                 │
                 ▼               ▼                 ▼
             listings       refresh_sessions    reviews
                 │                                 ▲
                 │                                 │
                 ▼                                 │
           listing_media                            │
                 │                                 │
                 └──────────────┐                  │
                                ▼                  │
                         conversations ─────────────┘
                           │       │
                           │       ├── conversation_members
                           │       │
                           │       └── messages
                           │
                           ▼
                         offers
                           │
                           ▼
                          deals
                           │
                           ▼
                         reviews

users/listings ──> reports
users ───────────> audit_events
users <──────────> favorites <────────── listings
```

## Important indexes

- users.email
- listings.status/category/created_at
- listings.seller_id
- messages.conversation_id/created_at
- offers.conversation_id/status
- deals.seller_id/status
- refresh_sessions.user_id/revoked_at/expires_at
- audit_events.created_at

These support the UI's main read patterns without indexing every column.

## Transaction boundaries

### Accept offer

One database transaction should:
1. lock/validate the offer
2. verify conversation membership
3. verify listing is active
4. reject competing pending offers
5. create the deal
6. update offer status
7. update listing status if the business rule requires it
8. create an audit event
9. commit

Never split this across unrelated commits.

### Send message

1. Authenticate user.
2. Verify membership.
3. Validate message length/type.
4. Persist message.
5. Commit.
6. Broadcast through WebSocket after persistence.

## Security boundaries

Authentication:
`users + refresh_sessions`

Authorization:
`role + ownership + conversation_members`

Marketplace:
`listings + favorites`

Communication:
`conversations + members + messages + offers`

Transaction:
`deals + reviews`

Trust & moderation:
`reports + audit_events`
