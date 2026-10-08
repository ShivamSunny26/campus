-- PostgreSQL reference schema.
-- Alembic migrations are the canonical deployment mechanism.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Full schema is represented by SQLAlchemy models and migrations.
-- Key table outline:

CREATE TABLE IF NOT EXISTS campus_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(320) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    full_name varchar(100) NOT NULL,
    role varchar(20) NOT NULL DEFAULT 'student',
    campus_name varchar(150) NOT NULL,
    campus_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    is_banned boolean NOT NULL DEFAULT false,
    bio text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE RESTRICT,
    title varchar(140) NOT NULL,
    description text NOT NULL,
    category varchar(40) NOT NULL,
    price numeric(12,2) NOT NULL CHECK (price > 0),
    price_unit varchar(30),
    pickup_location varchar(180) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active',
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    verified_seller_only boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_listings_discovery
ON listings(status, category, created_at DESC);

CREATE TABLE IF NOT EXISTS favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE CASCADE,
    role varchar(20) NOT NULL DEFAULT 'member',
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE RESTRICT,
    body text NOT NULL,
    message_type varchar(20) NOT NULL DEFAULT 'text',
    attachment_key varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_messages_conversation_created
ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    note text,
    status varchar(20) NOT NULL DEFAULT 'pending',
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    conversation_id uuid UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE RESTRICT,
    buyer_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE RESTRICT,
    seller_id uuid NOT NULL REFERENCES campus_users(id) ON DELETE RESTRICT,
    agreed_price numeric(12,2) NOT NULL CHECK (agreed_price > 0),
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    pickup_location varchar(180) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'confirmed',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
