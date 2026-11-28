-- =============================================================================
-- Migration: V7__create_device_tokens_schema.sql
-- Description: Device push notification tokens scoped to users
-- Database: PostgreSQL
-- =============================================================================

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    platform VARCHAR(16) NOT NULL CHECK (platform IN ('IOS', 'ANDROID')),
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_tokens_token UNIQUE (token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens (user_id);
