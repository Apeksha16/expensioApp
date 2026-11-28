package com.expensio.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtPropertiesTest {

    private static final String VALID_STRONG_SECRET =
            "very_strong_and_secure_cryptographically_generated_jwt_secret_with_sufficient_entropy_1234567890!";

    @Test
    @DisplayName("Validation succeeds with a sufficiently long secret in dev or test profile")
    void validate_WithValidSecretInTestProfile_ShouldSucceed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret(VALID_STRONG_SECRET);

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Validation succeeds with a sufficiently long secret in prod profile")
    void validate_WithValidSecretInProdProfile_ShouldSucceed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret(VALID_STRONG_SECRET);

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Fails validation when secret is missing or empty")
    void validate_WithMissingOrEmptySecret_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties propertiesWithNull = new JwtProperties(env);
        propertiesWithNull.setSecret(null);
        assertThatThrownBy(propertiesWithNull::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("required and cannot be empty");

        JwtProperties propertiesWithEmpty = new JwtProperties(env);
        propertiesWithEmpty.setSecret("   ");
        assertThatThrownBy(propertiesWithEmpty::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("required and cannot be empty");
    }

    @Test
    @DisplayName("Fails validation when secret has fewer than 256 bits (32 bytes) of entropy")
    void validate_WithInsufficientlyLongSecret_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret("short_secret_under_32_bytes!");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must contain at least 256 bits (32 bytes)");
    }

    @Test
    @DisplayName("Fails validation when a known development secret is used in a production profile")
    void validate_WithKnownDevSecretInProdProfile_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret("dev_secret_key_needs_to_be_at_least_256_bits_for_hmac_sha256_local_only!");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Known insecure/development JWT secret key detected");
    }

    @Test
    @DisplayName("Allows development secret when running under the dev profile")
    void validate_WithDevSecretInDevProfile_ShouldSucceed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret("dev_secret_key_needs_to_be_at_least_256_bits_for_hmac_sha256_local_only!");

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Fails validation if accessTokenExpirationMs is zero or negative")
    void validate_WithInvalidExpiration_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret(VALID_STRONG_SECRET);
        properties.setAccessTokenExpirationMs(0);

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("access-token-expiration-ms must be greater than zero");
    }

    @Test
    @DisplayName("Fails validation when secret consists of repeated identical characters")
    void validate_WithRepeatedSingleCharacter_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"); // 32 'a's

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("obvious weak or repeated pattern");
    }

    @Test
    @DisplayName("Fails validation when secret consists of trivial repeating short blocks")
    void validate_WithTrivialRepeatingPattern_ShouldThrowIllegalStateException() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties properties = new JwtProperties(env);
        properties.setSecret("abcdabcdabcdabcdabcdabcdabcdabcd"); // repeated "abcd" pattern

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("obvious weak or repeated pattern");
    }

    @Test
    @DisplayName("Accepts cryptographically secure random 256-bit Base64 and Hex secrets")
    void validate_WithCryptographicallyGeneratedRandomSecrets_ShouldSucceed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        // Example standard 32-byte (256-bit) cryptographically generated Base64 secret
        String base64Random = java.util.Base64.getEncoder().encodeToString(
                new byte[]{12, -45, 78, 19, -100, 34, 89, -12, 55, 91, -77, 23, 44, -88, 10, -5,
                           66, 120, -33, 99, 14, -82, 105, 41, -111, 72, 30, -50, 84, -19, 63, 101});

        JwtProperties propertiesBase64 = new JwtProperties(env);
        propertiesBase64.setSecret(base64Random);
        assertThatCode(propertiesBase64::validate).doesNotThrowAnyException();
    }
}
