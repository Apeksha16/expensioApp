package com.expensio.backend.db;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationScriptTest {

    @Test
    void v1MigrationScript_ExistsAndValidatesSchemaIntegrity() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/migration/V1__create_auth_and_user_schema.sql");
        assertThat(resource.exists()).isTrue();

        String sql;
        try (InputStream is = resource.getInputStream()) {
            sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }

        assertThat(sql).isNotEmpty();

        // 1. All 7 tables present
        assertThat(sql).contains("CREATE TABLE users");
        assertThat(sql).contains("CREATE TABLE user_profiles");
        assertThat(sql).contains("CREATE TABLE auth_identities");
        assertThat(sql).contains("CREATE TABLE user_mpin_credentials");
        assertThat(sql).contains("CREATE TABLE otp_verifications");
        assertThat(sql).contains("CREATE TABLE temporary_auth_tokens");
        assertThat(sql).contains("CREATE TABLE refresh_tokens");

        // 2. Foreign keys and cascade rules
        assertThat(sql).contains("REFERENCES users(id) ON DELETE CASCADE");

        // 3. Normalized unique indexes
        assertThat(sql).contains("uq_users_phone");
        assertThat(sql).contains("uq_users_email");
        assertThat(sql).contains("uq_user_profiles_username");
        assertThat(sql).contains("uq_auth_identities_provider_subject");
        assertThat(sql).contains("uq_temporary_auth_tokens_hash");
        assertThat(sql).contains("uq_refresh_tokens_hash");

        // 4. Security: No raw secrets or plaintext tokens
        assertThat(sql).contains("mpin_hash");
        assertThat(sql).contains("otp_hash");
        assertThat(sql).contains("token_hash");
        assertThat(sql).doesNotContain("plaintext");
        assertThat(sql).doesNotContain("raw_secret");
    }

    @Test
    void v5FriendsMigrationScript_ExistsAndValidatesSchemaConstraints() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/migration/V5__create_friends_schema.sql");
        assertThat(resource.exists()).isTrue();

        String sql;
        try (InputStream is = resource.getInputStream()) {
            sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }

        assertThat(sql).contains("CREATE TABLE participants");
        assertThat(sql).contains("CREATE TABLE guest_profiles");
        assertThat(sql).contains("CREATE TABLE friendships");
        assertThat(sql).contains("CREATE TABLE friend_audit_log");
        assertThat(sql).contains("CREATE TABLE IF NOT EXISTS outbox_events");
        assertThat(sql).contains("CHECK (requester_id <> addressee_id)");
        assertThat(sql).contains("CHECK (status IN ('PENDING', 'ACCEPTED'))");
        assertThat(sql).contains("GENERATED ALWAYS AS (LEAST(requester_id, addressee_id)) STORED");
        assertThat(sql).contains("GENERATED ALWAYS AS (GREATEST(requester_id, addressee_id)) STORED");
        assertThat(sql).contains("uq_friendships_pair");
        assertThat(sql).contains("uq_guest_profiles_owner_username");
    }
}
