package com.expensio.backend.auth.service;

import com.expensio.backend.auth.RefreshToken;
import com.expensio.backend.auth.RefreshTokenRepository;
import com.expensio.backend.exception.UnauthorizedException;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.TokenHashService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RefreshTokenServiceTest {

    private final Map<String, RefreshToken> tokensByHash = new HashMap<>();
    private final List<RefreshToken> savedTokens = new ArrayList<>();

    private RefreshTokenRepository refreshTokenRepository;
    private TokenHashService tokenHashService;
    private JwtProperties jwtProperties;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        tokensByHash.clear();
        savedTokens.clear();

        refreshTokenRepository = (RefreshTokenRepository) Proxy.newProxyInstance(
                RefreshTokenRepository.class.getClassLoader(),
                new Class<?>[]{RefreshTokenRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("save".equals(methodName)) {
                        RefreshToken token = (RefreshToken) args[0];
                        if (token.getId() == null) {
                            token.setId(UUID.randomUUID());
                        }
                        savedTokens.add(token);
                        tokensByHash.put(token.getTokenHash(), token);
                        return token;
                    } else if ("findByTokenHash".equals(methodName)) {
                        String hash = (String) args[0];
                        return Optional.ofNullable(tokensByHash.get(hash));
                    } else if ("findByUserId".equals(methodName)) {
                        UUID uid = (UUID) args[0];
                        return savedTokens.stream().filter(t -> uid.equals(t.getUserId())).toList();
                    }
                    return null;
                }
        );

        tokenHashService = new TokenHashService();
        jwtProperties = new JwtProperties();
        jwtProperties.setRefreshTokenExpirationMs(2592000000L); // 30 days
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, tokenHashService, jwtProperties);
    }

    @Test
    @DisplayName("Should create fresh refresh token with hashed value")
    void testCreateRefreshToken() {
        UUID userId = UUID.randomUUID();
        String rawToken = refreshTokenService.createRefreshToken(userId, "Pixel 8", "127.0.0.1");

        assertNotNull(rawToken);
        assertEquals(64, rawToken.length());
        assertEquals(1, savedTokens.size());
        assertEquals(tokenHashService.hash(rawToken), savedTokens.get(0).getTokenHash());
    }

    @Test
    @DisplayName("Should rotate valid refresh token")
    void testRotateRefreshToken() {
        UUID userId = UUID.randomUUID();
        String oldRaw = "abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef12";
        String oldHash = tokenHashService.hash(oldRaw);

        RefreshToken oldToken = new RefreshToken(userId, oldHash, Instant.now().plus(30, ChronoUnit.DAYS));
        oldToken.setRevoked(false);
        tokensByHash.put(oldHash, oldToken);
        savedTokens.add(oldToken);

        RefreshTokenService.RotationResult result = refreshTokenService.rotateRefreshToken(oldRaw, "Pixel 8", "127.0.0.1");

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertNotNull(result.getNewRawRefreshToken());
        assertNotEquals(oldRaw, result.getNewRawRefreshToken());

        assertTrue(oldToken.isRevoked());
        assertNotNull(oldToken.getReplacedByTokenHash());
    }

    @Test
    @DisplayName("Should detect refresh token reuse and revoke all user sessions")
    void testRefreshTokenReuseDetection() {
        UUID userId = UUID.randomUUID();
        String oldRaw = "reused_token_raw_value_1234567890";
        String oldHash = tokenHashService.hash(oldRaw);

        RefreshToken compromisedToken = new RefreshToken(userId, oldHash, Instant.now().plus(10, ChronoUnit.DAYS));
        compromisedToken.setRevoked(true); // already revoked!
        tokensByHash.put(oldHash, compromisedToken);
        savedTokens.add(compromisedToken);

        RefreshToken activeToken = new RefreshToken(userId, "another_hash", Instant.now().plus(10, ChronoUnit.DAYS));
        activeToken.setRevoked(false);
        tokensByHash.put("another_hash", activeToken);
        savedTokens.add(activeToken);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                refreshTokenService.rotateRefreshToken(oldRaw, "Hacker Device", "10.0.0.1")
        );

        assertTrue(ex.getMessage().contains("Compromised session detected"));
        assertTrue(activeToken.isRevoked());
    }
}
