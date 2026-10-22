package com.expensio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    Optional<OtpVerification> findTopByTargetIdentifierAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String targetIdentifier,
            String purpose
    );
}
