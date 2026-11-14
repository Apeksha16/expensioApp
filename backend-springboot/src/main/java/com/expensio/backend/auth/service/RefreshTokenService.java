package com.expensio.backend.auth.service;

import com.expensio.backend.auth.RefreshToken;
import com.expensio.backend.auth.RefreshTokenRepository;
import com.expensio.backend.exception.UnauthorizedException;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.TokenHashService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenHashService tokenHashService;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            TokenHashService tokenHashService,
            JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenHashService = tokenHashService;
        this.jwtProperties = jwtProperties;
    }

    public static class RotationResult {
        private final UUID userId;
        private final String newRawRefreshToken;

        public RotationResult(UUID userId, String newRawRefreshToken) {
            this.userId = userId;
            this.newRawRefreshToken = newRawRefreshToken;
        }

        public UUID getUserId() { return userId; }
        public String getNewRawRefreshToken() { return newRawRefreshToken; }
    }

    @Transactional
    public String createRefreshToken(UUID userId, String deviceInfo, String ipAddress) {
        String rawToken = tokenHashService.generateSecureRandomToken(32);
        String tokenHash = tokenHashService.hash(rawToken);

        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.getRefreshTokenExpirationMs(), ChronoUnit.MILLIS);

        RefreshToken token = new RefreshToken(userId, tokenHash, expiresAt);
        token.setDeviceInfo(deviceInfo);
        token.setIpAddress(ipAddress);
        token.setRevoked(false);

        refreshTokenRepository.save(token);
        return rawToken;
    }

    /**
     * Rotates an existing refresh token:
     * Validates that the token exists and is active.
     * If already revoked, triggers reuse-detection and revokes all user sessions.
     */
    @Transactional
    public RotationResult rotateRefreshToken(String rawOldRefreshToken, String deviceInfo, String ipAddress) {
        if (rawOldRefreshToken == null || rawOldRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing");
        }

        String oldHash = tokenHashService.hash(rawOldRefreshToken.trim());
        RefreshToken oldToken = refreshTokenRepository.findByTokenHash(oldHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        UUID userId = oldToken.getUserId();
        Instant now = Instant.now();

        // Check reuse detection
        if (oldToken.isRevoked()) {
            log.warn("⚠️ [Security Alert] Refresh token reuse detected for user {}. Revoking all sessions!", userId);
            revokeAllUserSessions(userId);
            throw new UnauthorizedException("Compromised session detected. All active sessions have been revoked. Please log in again.");
        }

        // Check expiration
        if (now.isAfter(oldToken.getExpiresAt())) {
            oldToken.setRevoked(true);
            oldToken.setRevokedAt(now);
            refreshTokenRepository.save(oldToken);
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        // Generate new token
        String newRawToken = tokenHashService.generateSecureRandomToken(32);
        String newHash = tokenHashService.hash(newRawToken);
        Instant newExpiresAt = now.plus(jwtProperties.getRefreshTokenExpirationMs(), ChronoUnit.MILLIS);

        RefreshToken newToken = new RefreshToken(userId, newHash, newExpiresAt);
        newToken.setDeviceInfo(deviceInfo != null ? deviceInfo : oldToken.getDeviceInfo());
        newToken.setIpAddress(ipAddress != null ? ipAddress : oldToken.getIpAddress());
        newToken.setRevoked(false);
        refreshTokenRepository.save(newToken);

        // Mark old token revoked and record replacement
        oldToken.setRevoked(true);
        oldToken.setRevokedAt(now);
        oldToken.setReplacedByTokenHash(newHash);
        refreshTokenRepository.save(oldToken);

        return new RotationResult(userId, newRawToken);
    }

    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        String tokenHash = tokenHashService.hash(rawRefreshToken.trim());
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllUserSessions(UUID userId) {
        if (userId == null) return;
        refreshTokenRepository.findByUserId(userId).forEach(token -> {
            if (!token.isRevoked()) {
                token.setRevoked(true);
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            }
        });
    }
}

