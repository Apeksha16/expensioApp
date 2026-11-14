-- =============================================================================
-- Migration: V4__add_lockout_columns_to_credentials.sql
-- Description: Adds brute-force protection columns to credentials table
-- Database: PostgreSQL (Supabase compatible)
-- =============================================================================

ALTER TABLE credentials ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS lockout_expires_at TIMESTAMPTZ NULL;

