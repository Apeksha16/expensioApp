package com.expensio.backend.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.IncorrectClaimException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.PrematureJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String TEST_SECRET = "super_secure_test_secret_key_with_at_least_256_bits_length!";
    private static final String DIFFERENT_SECRET = "completely_different_secret_key_also_exceeding_256_bits_length!";
    private static final String ISSUER = "expensio-api-test";
    private static final Instant BASE_TIME = Instant.parse("2026-10-21T12:00:00Z");

    private JwtProperties jwtProperties;
    private Clock fixedClock;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");

        jwtProperties = new JwtProperties(env);
        jwtProperties.setSecret(TEST_SECRET);
        jwtProperties.setAccessTokenExpirationMs(3600000L); // 1 hour
        jwtProperties.setRefreshTokenExpirationMs(86400000L); // 24 hours
        jwtProperties.setIssuer(ISSUER);
        jwtProperties.validate();

        fixedClock = Clock.fixed(BASE_TIME, ZoneOffset.UTC);
        jwtService = new JwtService(jwtProperties, fixedClock);
    }

    @Test
    @DisplayName("Generates a valid signed HS256 access token with claims")
    void generateAccessToken_ShouldProduceValidSignedToken() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId);

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // Header, payload, signature
        assertThat(jwtService.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Extracts the expected UUID subject from a valid token")
    void extractUserId_ShouldReturnExactExpectedUuid() {
        UUID expectedUserId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(expectedUserId);
        UUID actualUserId = jwtService.extractUserId(token);

        assertThat(actualUserId).isEqualTo(expectedUserId);
    }

    @Test
    @DisplayName("Accepts and validates a fresh, correctly signed token")
    void validateToken_WithValidToken_ShouldReturnTrue() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId);

        boolean isValid = jwtService.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Rejects an expired token with ExpiredJwtException")
    void extractUserId_WithExpiredToken_ShouldThrowExpiredJwtException() {
        UUID userId = UUID.randomUUID();
        // Issued 2 hours ago, expired 1 hour ago relative to BASE_TIME
        Instant issuedAt = BASE_TIME.minusSeconds(7200);
        Instant expiredAt = BASE_TIME.minusSeconds(3600);

        String expiredToken = jwtService.generateAccessToken(userId, issuedAt, expiredAt);

        assertThatThrownBy(() -> jwtService.extractUserId(expiredToken))
                .isInstanceOf(ExpiredJwtException.class);
        assertThat(jwtService.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("Rejects token signed with a different secret key")
    void extractUserId_SignedWithDifferentSecret_ShouldThrowSignatureException() {
        UUID userId = UUID.randomUUID();
        SecretKey alienKey = Keys.hmacShaKeyFor(DIFFERENT_SECRET.getBytes(StandardCharsets.UTF_8));

        String foreignToken = Jwts.builder()
                .header().type("JWT").and()
                .subject(userId.toString())
                .issuer(ISSUER)
                .issuedAt(Date.from(BASE_TIME))
                .expiration(Date.from(BASE_TIME.plusSeconds(3600)))
                .signWith(alienKey, Jwts.SIG.HS256)
                .compact();

        assertThatThrownBy(() -> jwtService.extractUserId(foreignToken))
                .isInstanceOf(SignatureException.class);
        assertThat(jwtService.validateToken(foreignToken)).isFalse();
    }

    @Test
    @DisplayName("Rejects malformed token strings")
    void extractUserId_WithMalformedTokenString_ShouldThrowException() {
        assertThatThrownBy(() -> jwtService.extractUserId("not.a.valid.jwt.string"))
                .isInstanceOf(MalformedJwtException.class);

        assertThatThrownBy(() -> jwtService.extractUserId("randomGarbageString"))
                .isInstanceOf(MalformedJwtException.class);

        assertThatThrownBy(() -> jwtService.extractUserId(""))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> jwtService.extractUserId(null))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(jwtService.validateToken("not.a.valid.jwt.string")).isFalse();
    }

    @Test
    @DisplayName("Rejects tokens with mismatched issuer claims")
    void extractUserId_WithWrongIssuer_ShouldThrowIncorrectClaimException() {
        UUID userId = UUID.randomUUID();
        SecretKey signingKey = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String invalidIssuerToken = Jwts.builder()
                .header().type("JWT").and()
                .subject(userId.toString())
                .issuer("malicious-fake-issuer")
                .issuedAt(Date.from(BASE_TIME))
                .expiration(Date.from(BASE_TIME.plusSeconds(3600)))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();

        assertThatThrownBy(() -> jwtService.extractUserId(invalidIssuerToken))
                .isInstanceOf(IncorrectClaimException.class);
        assertThat(jwtService.validateToken(invalidIssuerToken)).isFalse();
    }

    @Test
    @DisplayName("Rejects tokens where subject is not a valid UUID")
    void extractUserId_WithNonUuidSubject_ShouldThrowIllegalArgumentException() {
        SecretKey signingKey = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String nonUuidToken = Jwts.builder()
                .header().type("JWT").and()
                .subject("not-a-uuid-username")
                .issuer(ISSUER)
                .issuedAt(Date.from(BASE_TIME))
                .expiration(Date.from(BASE_TIME.plusSeconds(3600)))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();

        assertThatThrownBy(() -> jwtService.extractUserId(nonUuidToken))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not a valid UUID");
    }

    @Test
    @DisplayName("Rejects a token that is not yet valid (nbf in future)")
    void extractUserId_WithFutureNotBefore_ShouldThrowPrematureJwtException() {
        UUID userId = UUID.randomUUID();
        Instant issuedAt = BASE_TIME;
        Instant notBefore = BASE_TIME.plusSeconds(600); // 10 minutes in the future
        Instant expiration = BASE_TIME.plusSeconds(3600);

        String futureToken = jwtService.generateAccessToken(userId, issuedAt, notBefore, expiration);

        assertThatThrownBy(() -> jwtService.extractUserId(futureToken))
                .isInstanceOf(PrematureJwtException.class);
        assertThat(jwtService.validateToken(futureToken)).isFalse();
    }

    @Test
    @DisplayName("Rejects unsigned token with alg: none as UnsupportedJwtException")
    void extractUserId_WithAlgNoneToken_ShouldThrowUnsupportedJwtException() {
        UUID userId = UUID.randomUUID();
        String header = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("{\"sub\":\"" + userId + "\",\"iss\":\"" + ISSUER + "\"}").getBytes(StandardCharsets.UTF_8));
        String unsignedToken = header + "." + payload + ".";

        assertThatThrownBy(() -> jwtService.extractUserId(unsignedToken))
                .isInstanceOf(io.jsonwebtoken.UnsupportedJwtException.class);
        assertThat(jwtService.validateToken(unsignedToken)).isFalse();
    }

    @Test
    @DisplayName("Rejects asymmetric algorithm token (e.g. RS256) as UnsupportedJwtException")
    void extractUserId_WithAsymmetricAlgorithmToken_ShouldThrowUnsupportedJwtException() throws Exception {
        UUID userId = UUID.randomUUID();
        java.security.KeyPairGenerator keyGen = java.security.KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        java.security.KeyPair rsaKeyPair = keyGen.generateKeyPair();

        String rsaToken = Jwts.builder()
                .header().type("JWT").and()
                .subject(userId.toString())
                .issuer(ISSUER)
                .issuedAt(Date.from(BASE_TIME))
                .expiration(Date.from(BASE_TIME.plusSeconds(3600)))
                .signWith(rsaKeyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> jwtService.extractUserId(rsaToken))
                .isInstanceOf(io.jsonwebtoken.UnsupportedJwtException.class);
        assertThat(jwtService.validateToken(rsaToken)).isFalse();
    }
}
