-- =============================================================================
-- Migration: V6__add_outbox_next_attempt.sql
-- Description: Adds next_attempt_at column to outbox_events for exponential backoff
-- Database: PostgreSQL
-- =============================================================================

ALTER TABLE outbox_events
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_events_pending_next_attempt
    ON outbox_events (status, next_attempt_at, created_at);
