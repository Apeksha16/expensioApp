package com.expensio.backend.friends.push;

import com.expensio.backend.friends.config.FriendsRateLimiter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeviceTokenService {

    private static final int REGISTER_MAX_PER_MINUTE = 10;

    private final DeviceTokenRepository deviceTokenRepository;
    private final FriendsRateLimiter rateLimiter;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository, FriendsRateLimiter rateLimiter) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public void registerToken(UUID userId, RegisterDeviceRequest request) {
        rateLimiter.checkAndConsume("device_register", userId.toString(), REGISTER_MAX_PER_MINUTE, 60);

        String trimmedToken = request.token().trim();
        DeviceToken existing = deviceTokenRepository.findByToken(trimmedToken).orElse(null);
        if (existing != null) {
            existing.setUserId(userId);
            existing.setPlatform(request.platform());
            existing.setPushEnabled(true);
            deviceTokenRepository.save(existing);
        } else {
            deviceTokenRepository.save(new DeviceToken(userId, trimmedToken, request.platform()));
        }
    }

    @Transactional
    public void removeToken(UUID userId, String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        deviceTokenRepository.deleteByUserIdAndToken(userId, token.trim());
    }

    @Transactional
    public void removeAllForUser(UUID userId) {
        if (userId != null) {
            deviceTokenRepository.deleteAllByUserId(userId);
        }
    }
}
