package com.expensio.backend.friends.push;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {

    Optional<DeviceToken> findByToken(String token);

    Optional<DeviceToken> findByUserIdAndToken(UUID userId, String token);

    List<DeviceToken> findByUserIdAndPushEnabledTrue(UUID userId);

    void deleteByUserIdAndToken(UUID userId, String token);

    void deleteAllByUserId(UUID userId);
}
