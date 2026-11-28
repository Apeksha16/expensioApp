-- =============================================================================
-- Migration: V1__create_auth_and_user_schema.sql
-- Description: Core schema for users, profiles, identities, OTPs, MPIN, and sessions
-- Database: PostgreSQL (Supabase compatible)
-- =============================================================================

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE UNIQUE INDEX uq_users_phone ON users (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX uq_users_email ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_users_status ON users (status);

-- 2. User Profiles Table (1:1 with users)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50) NULL,
    avatar_id VARCHAR(50) NULL,
    monthly_salary NUMERIC(12, 2) NULL,
    monthly_budget NUMERIC(12, 2) NULL,
    is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_user_profiles_username ON user_profiles (LOWER(username)) WHERE username IS NOT NULL;
CREATE INDEX idx_user_profiles_complete ON user_profiles (is_profile_complete);

-- 3. Authentication Identities (OAuth / Social / Supported Provider Links)
CREATE TABLE auth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_auth_identities_provider_subject UNIQUE (provider, provider_subject)
);

CREATE INDEX idx_auth_identities_user_id ON auth_identities (user_id);
CREATE INDEX idx_auth_identities_provider_email ON auth_identities (LOWER(provider_email)) WHERE provider_email IS NOT NULL;

-- 4. User MPIN Credentials (Hashed 4-digit security PIN)
CREATE TABLE user_mpin_credentials (
    user_id UUID PRIMARY KEY,
    mpin_hash VARCHAR(255) NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_mpin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. OTP Verifications (Phone and Email OTP verification state)
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL,
    target_identifier VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_verifications_target ON otp_verifications (target_identifier, purpose, expires_at);
CREATE INDEX idx_otp_verifications_consumed ON otp_verifications (consumed_at);

-- 6. Temporary Authentication Tokens (Registration & Recovery Capabilities)
CREATE TABLE temporary_auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    token_hash VARCHAR(255) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_temporary_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_temporary_auth_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_temp_tokens_lookup ON temporary_auth_tokens (identifier, token_type, expires_at);

-- 7. Refresh Tokens / Sessions (Token lifecycle and revocation)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,
    replaced_by_token_hash VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_validity ON refresh_tokens (expires_at, is_revoked);
