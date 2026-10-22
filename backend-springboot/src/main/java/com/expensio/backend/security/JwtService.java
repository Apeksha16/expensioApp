package com.expensio.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Service responsible for JWT access token creation, parsing, and cryptographic verification.
 * Adheres to HS256 with >= 256-bit entropy keys and strict claim validation.
 */
@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final Clock clock;
    private final SecretKey signingKey;

    @org.springframework.beans.factory.annotation.Autowired
    public JwtService(JwtProperties jwtProperties, Clock clock) {
        this.jwtProperties = jwtProperties;
        this.clock = clock != null ? clock : Clock.systemUTC();
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public JwtService(JwtProperties jwtProperties) {
        this(jwtProperties, Clock.systemUTC());
    }

    /**
     * Generates a signed HS256 access token for the given user UUID using configured expiration.
     */
    public String generateAccessToken(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        Instant now = clock.instant();
        Instant expiry = now.plusMillis(jwtProperties.getAccessTokenExpirationMs());
        return generateAccessToken(userId, now, null, expiry);
    }

    /**
     * Generates a signed access token with explicit issued-at and expiration timestamps.
     */
    public String generateAccessToken(UUID userId, Instant issuedAt, Instant expiration) {
        return generateAccessToken(userId, issuedAt, null, expiration);
    }

    /**
     * Generates a signed access token with explicit issued-at, optional not-before, and expiration timestamps.
     */
    public String generateAccessToken(UUID userId, Instant issuedAt, Instant notBefore, Instant expiration) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (issuedAt == null) {
            throw new IllegalArgumentException("issuedAt must not be null");
        }
        if (expiration == null) {
            throw new IllegalArgumentException("expiration must not be null");
        }

        var builder = Jwts.builder()
                .header()
                    .type("JWT")
                    .and()
                .subject(userId.toString())
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiration));

        if (notBefore != null) {
            builder.notBefore(Date.from(notBefore));
        }

        return builder
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Parses and cryptographically validates the JWT token against the signing key,
     * configured issuer, and clock timestamps (iat, exp, nbf).
     *
     * @param token Compact serialized JWT string
     * @return Validated JWT payload claims
     * @throws JwtException or IllegalArgumentException on any validation or parsing failure
     */
    public Claims parseAndValidateClaims(String token) {
        if (!StringUtils.hasText(token)) {
            throw new IllegalArgumentException("JWT token must not be null or empty");
        }

        io.jsonwebtoken.Jws<Claims> jws = Jwts.parser()
                .verifyWith(signingKey)
                .clock(() -> Date.from(clock.instant()))
                .requireIssuer(jwtProperties.getIssuer())
                .build()
                .parseSignedClaims(token.trim());

        String algorithm = jws.getHeader().getAlgorithm();
        if (!Jwts.SIG.HS256.getId().equalsIgnoreCase(algorithm)) {
            throw new io.jsonwebtoken.UnsupportedJwtException(
                    "Unsupported JWT algorithm: " + algorithm + ". Only HS256 is permitted."
            );
        }

        return jws.getPayload();
    }

    /**
     * Validates the token and extracts the authenticated user's UUID from the subject claim.
     *
     * @param token Compact serialized JWT string
     * @return Authenticated user UUID
     */
    public UUID extractUserId(String token) {
        Claims claims = parseAndValidateClaims(token);
        String subject = claims.getSubject();
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("JWT token subject claim is missing");
        }
        try {
            return UUID.fromString(subject.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("JWT token subject is not a valid UUID", ex);
        }
    }

    /**
     * Non-throwing token validation helper.
     */
    public boolean validateToken(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public JwtProperties getJwtProperties() {
        return jwtProperties;
    }
}
