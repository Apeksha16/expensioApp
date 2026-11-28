package com.expensio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TemporaryAuthTokenRepository extends JpaRepository<TemporaryAuthToken, UUID> {

    Optional<TemporaryAuthToken> findByTokenHash(String tokenHash);

    Optional<TemporaryAuthToken> findByTokenHashAndConsumedAtIsNull(String tokenHash);
}
