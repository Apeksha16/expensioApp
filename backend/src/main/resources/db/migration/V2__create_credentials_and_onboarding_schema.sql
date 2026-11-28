-- =============================================================================
-- Migration: V2__create_credentials_and_onboarding_schema.sql
-- Description: Adds credentials, onboarding sessions, audit logs, and OTP enhancements
-- Database: PostgreSQL (Supabase compatible)
-- =============================================================================

-- 1. Credentials Table (Argon2id password hashes)
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'ARGON2ID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_credentials_user UNIQUE (user_id)
);

CREATE INDEX idx_credentials_user_id ON credentials (user_id);

-- 2. Onboarding Sessions Table
CREATE TABLE onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token_hash VARCHAR(255) NOT NULL UNIQUE,
    current_step VARCHAR(50) NOT NULL DEFAULT 'PROFILE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onboarding_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions (user_id);
CREATE INDEX idx_onboarding_sessions_token ON onboarding_sessions (session_token_hash);

-- 3. Enhance OTP Verifications with challenge tracking and cooldowns
ALTER TABLE otp_verifications ADD COLUMN challenge_id VARCHAR(64) NULL;
ALTER TABLE otp_verifications ADD COLUMN resend_available_at TIMESTAMPTZ NULL;
ALTER TABLE otp_verifications ADD COLUMN ip_address VARCHAR(45) NULL;
ALTER TABLE otp_verifications ADD COLUMN device_id VARCHAR(255) NULL;

CREATE UNIQUE INDEX uq_otp_verifications_challenge ON otp_verifications (challenge_id) WHERE challenge_id IS NOT NULL;

-- 4. Audit Logs Table (Security and account activity)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    details TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

