package com.expensio.backend.security;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Dedicated, validated configuration properties for JWT settings.
 * Maps configuration properties prefixed with 'app.jwt'.
 */
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    public static final int MIN_SECRET_LENGTH_BYTES = 32; // 256 bits required for HS256

    private static final List<String> KNOWN_WEAK_SECRETS = List.of(
            "dev_secret_key_needs_to_be_at_least_256_bits_for_hmac_sha256_local_only!",
            "expensio_default_jwt_secret_key_needs_to_be_at_least_256_bits_for_hmac_sha256",
            "your_super_secret_jwt_key_at_least_32_characters_long",
            "12345678901234567890123456789012",
            "abcdefghijklmnopqrstuvwxyz012345",
            "change_me_in_production_jwt_secret_key!"
    );

    private final Environment environment;

    private String secret;
    private long accessTokenExpirationMs = 86400000L; // 24 hours
    private long refreshTokenExpirationMs = 2592000000L; // 30 days
    private String issuer = "expensio-api";

    public JwtProperties(Environment environment) {
        this.environment = environment;
    }

    /**
     * Validates that the configured JWT secret meets minimum cryptographic constraints.
     * Note: While rejecting trivial repeated characters or common placeholder strings protects
     * against obvious misconfigurations, character diversity alone does not prove true cryptographic
     * entropy. Production secrets MUST be generated using a cryptographically secure random number
     * generator (e.g., `openssl rand -base64 32`).
     */
    @PostConstruct
    public void validate() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException(
                    "JWT secret configuration ('app.jwt.secret') is required and cannot be empty. " +
                    "Set the JWT_SECRET environment variable with a secure key containing at least 256 bits of entropy."
            );
        }

        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_LENGTH_BYTES) {
            throw new IllegalStateException(
                    "JWT secret configuration ('app.jwt.secret') is too short. " +
                    "It must contain at least 256 bits (32 bytes) of entropy for HMAC-SHA256, but had " +
                    secretBytes.length + " bytes."
            );
        }

        // Reject obvious weak secrets such as repeated single characters or trivial patterns
        if (isObviousWeakSecret(secret)) {
            throw new IllegalStateException(
                    "JWT secret configuration ('app.jwt.secret') is an obvious weak or repeated pattern. " +
                    "Production secrets must be generated using a cryptographically secure random generator."
            );
        }

        if (accessTokenExpirationMs <= 0) {
            throw new IllegalStateException("JWT access-token-expiration-ms must be greater than zero.");
        }

        List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());
        boolean isDevOrTest = activeProfiles.contains("dev")
                || activeProfiles.contains("test")
                || environment.getProperty("spring.application.name", "").contains("test");
        if (activeProfiles.isEmpty()) {
            isDevOrTest = isDevOrTest || Arrays.asList(environment.getDefaultProfiles()).contains("dev");
        }

        // In non-dev, non-test environments (e.g. prod), reject known insecure development keys
        if (!isDevOrTest && KNOWN_WEAK_SECRETS.contains(secret)) {
            throw new IllegalStateException(
                    "Known insecure/development JWT secret key detected in a non-development runtime environment. " +
                    "Production secrets must be cryptographically generated and configured via JWT_SECRET."
            );
        }
    }

    private boolean isObviousWeakSecret(String candidate) {
        String trimmed = candidate.trim();
        // Fewer than 4 distinct characters across 32+ characters indicates trivial repetition (e.g. "aaaa...", "abab...")
        if (trimmed.chars().distinct().count() <= 3) {
            return true;
        }

        // Check for trivial repeating short blocks (1 to 4 characters repeating entirely across the secret)
        for (int blockLen = 1; blockLen <= 4; blockLen++) {
            if (trimmed.length() % blockLen == 0) {
                String block = trimmed.substring(0, blockLen);
                if (trimmed.replace(block, "").isEmpty()) {
                    return true;
                }
            }
        }

        return false;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    public void setAccessTokenExpirationMs(long accessTokenExpirationMs) {
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    public void setRefreshTokenExpirationMs(long refreshTokenExpirationMs) {
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
