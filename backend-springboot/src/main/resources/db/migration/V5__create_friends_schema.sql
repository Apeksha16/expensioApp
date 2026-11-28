-- =============================================================================
-- Migration: V5__create_friends_schema.sql
-- Description: Friends module schema (participants, friendships, guest_profiles,
--              friend_audit_log, outbox_events, and missing onboarding tables)
-- Database: PostgreSQL
-- =============================================================================

-- Ensure pre-existing JPA-managed tables exist for ddl-auto=validate on clean DBs
CREATE TABLE IF NOT EXISTS user_employment (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employment_type VARCHAR(30) NOT NULL,
    monthly_income_minor BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_financial_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cash_balance_minor BIGINT NOT NULL DEFAULT 0,
    savings_balance_minor BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created ON outbox_events (status, created_at);

-- 1. Shared participant registry (real users and non-login guests)
CREATE TABLE participants (
    id UUID PRIMARY KEY,
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('USER', 'GUEST')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backfill existing users into participants
INSERT INTO participants (id, kind, created_at)
SELECT id, 'USER', created_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- Keep participants in sync whenever a new real user is inserted
CREATE OR REPLACE FUNCTION fn_register_user_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO participants (id, kind, created_at)
    VALUES (NEW.id, 'USER', COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_register_participant ON users;
CREATE TRIGGER trg_users_register_participant
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION fn_register_user_participant();

-- 2. Guest profiles (owned by a real user; cannot authenticate)
CREATE TABLE guest_profiles (
    id UUID PRIMARY KEY REFERENCES participants(id) ON DELETE RESTRICT,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    avatar_id VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retired_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_guest_profiles_owner_user_id ON guest_profiles (owner_user_id);
CREATE UNIQUE INDEX uq_guest_profiles_owner_username
    ON guest_profiles (owner_user_id, LOWER(username));

-- 3. Friendships (unordered pair uniqueness via generated columns)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    addressee_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED')),
    pair_low UUID GENERATED ALWAYS AS (LEAST(requester_id, addressee_id)) STORED,
    pair_high UUID GENERATED ALWAYS AS (GREATEST(requester_id, addressee_id)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_friendships_no_self CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX uq_friendships_pair ON friendships (pair_low, pair_high);
CREATE INDEX idx_friendships_requester_id ON friendships (requester_id);
CREATE INDEX idx_friendships_addressee_id ON friendships (addressee_id);
CREATE INDEX idx_friendships_status ON friendships (status);

-- 4. Friend audit log
CREATE TABLE friend_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id UUID NOT NULL,
    metadata TEXT NULL,
    correlation_id VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_friend_audit_log_actor ON friend_audit_log (actor_user_id, created_at DESC);
CREATE INDEX idx_friend_audit_log_target ON friend_audit_log (target_type, target_id);
