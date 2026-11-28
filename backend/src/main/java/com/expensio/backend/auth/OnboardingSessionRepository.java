package com.expensio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingSessionRepository extends JpaRepository<OnboardingSession, UUID> {

    Optional<OnboardingSession> findBySessionTokenHashAndIsActiveTrue(String sessionTokenHash);

    Optional<OnboardingSession> findByUserIdAndIsActiveTrue(UUID userId);

    Optional<OnboardingSession> findTopByUserIdAndIsActiveTrueOrderByCreatedAtDesc(UUID userId);

    void deleteByUserId(UUID userId);
}

