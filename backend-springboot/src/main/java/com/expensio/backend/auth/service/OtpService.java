package com.expensio.backend.auth.service;

import com.expensio.backend.auth.OtpVerification;
import com.expensio.backend.auth.OtpVerificationRepository;
import com.expensio.backend.communication.EmailService;
import com.expensio.backend.communication.SmsService;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.security.TokenHashService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    public static final String TARGET_EMAIL = "EMAIL";
    public static final String TARGET_PHONE = "PHONE";

    public static final String PURPOSE_EMAIL_VERIFICATION = "EMAIL_VERIFICATION";
    public static final String PURPOSE_MOBILE_VERIFICATION = "MOBILE_VERIFICATION";
    public static final String PURPOSE_MOBILE_LOGIN = "MOBILE_LOGIN";
    public static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final OtpVerificationRepository otpRepository;
    private final TokenHashService tokenHashService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(
            OtpVerificationRepository otpRepository,
            TokenHashService tokenHashService,
            EmailService emailService,
            SmsService smsService) {
        this.otpRepository = otpRepository;
        this.tokenHashService = tokenHashService;
        this.emailService = emailService;
        this.smsService = smsService;
    }

    public static class OtpChallengeResult {
        private final String challengeId;
        private final int expiresInSeconds;
        private final int resendCooldownSeconds;

        public OtpChallengeResult(String challengeId, int expiresInSeconds, int resendCooldownSeconds) {
            this.challengeId = challengeId;
            this.expiresInSeconds = expiresInSeconds;
            this.resendCooldownSeconds = resendCooldownSeconds;
        }

        public String getChallengeId() { return challengeId; }
        public int getExpiresInSeconds() { return expiresInSeconds; }
        public int getResendCooldownSeconds() { return resendCooldownSeconds; }
    }

    /**
     * Issues an OTP challenge for the given target, purpose, IP and device.
     */
    @Transactional
    public OtpChallengeResult startChallenge(String targetType, String targetIdentifier, String purpose, String ipAddress, String deviceId) {
        Instant now = Instant.now();

        // 1. Check existing unconsumed active challenge for cooldown
        Optional<OtpVerification> existingOpt = otpRepository.findTopByTargetIdentifierAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                targetIdentifier,
                purpose
        );

        if (existingOpt.isPresent()) {
            OtpVerification existing = existingOpt.get();
            if (existing.getResendAvailableAt() != null && now.isBefore(existing.getResendAvailableAt())) {
                long waitSeconds = ChronoUnit.SECONDS.between(now, existing.getResendAvailableAt());
                throw new BadRequestException("Please wait " + waitSeconds + " seconds before requesting a new OTP code");
            }
            // Invalidate prior challenge by marking it consumed/expired
            existing.setConsumedAt(now);
            otpRepository.save(existing);
        }

        // 2. Generate 6-digit random code
        int code = 100000 + secureRandom.nextInt(900000);
        String plainOtp = String.valueOf(code);
        String hashedOtp = tokenHashService.hash(plainOtp);

        // 3. Create new challenge
        String challengeId = UUID.randomUUID().toString();
        Instant expiresAt = now.plus(OTP_VALIDITY_MINUTES, ChronoUnit.MINUTES);
        Instant resendAvailableAt = now.plus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS);

        OtpVerification challenge = new OtpVerification(targetType, targetIdentifier, hashedOtp, purpose, expiresAt);
        challenge.setChallengeId(challengeId);
        challenge.setResendAvailableAt(resendAvailableAt);
        challenge.setIpAddress(ipAddress);
        challenge.setDeviceId(deviceId);
        challenge.setMaxAttempts(MAX_ATTEMPTS);
        challenge.setAttempts(0);

        otpRepository.save(challenge);

        // 4. Dispatch via appropriate channel
        if (TARGET_EMAIL.equalsIgnoreCase(targetType)) {
            emailService.sendOtpEmail(targetIdentifier, plainOtp, OTP_VALIDITY_MINUTES);
        } else if (TARGET_PHONE.equalsIgnoreCase(targetType)) {
            smsService.sendOtpSms(targetIdentifier, plainOtp, OTP_VALIDITY_MINUTES);
        }

        return new OtpChallengeResult(challengeId, OTP_VALIDITY_MINUTES * 60, RESEND_COOLDOWN_SECONDS);
    }

    /**
     * Verifies the OTP code against challenge ID or target identifier.
     */
    @Transactional
    public boolean verifyChallenge(String challengeId, String targetIdentifier, String purpose, String plainOtp) {
        if (plainOtp == null || plainOtp.isBlank()) {
            throw new BadRequestException("OTP code is required");
        }

        Instant now = Instant.now();
        OtpVerification verification;

        if (challengeId != null && !challengeId.isBlank()) {
            verification = otpRepository.findByChallengeId(challengeId.trim())
                    .orElseThrow(() -> new BadRequestException("Invalid or expired OTP challenge"));
        } else if (targetIdentifier != null && !targetIdentifier.isBlank()) {
            verification = otpRepository.findTopByTargetIdentifierAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                    targetIdentifier.trim(),
                    purpose
            ).orElseThrow(() -> new BadRequestException("No active OTP challenge found"));
        } else {
            throw new BadRequestException("Either challengeId or target identifier is required");
        }

        // Check purpose
        if (!verification.getPurpose().equalsIgnoreCase(purpose)) {
            throw new BadRequestException("Invalid challenge purpose");
        }

        // Check if already consumed
        if (verification.getConsumedAt() != null) {
            throw new BadRequestException("This OTP has already been used");
        }

        // Check expiry
        if (now.isAfter(verification.getExpiresAt())) {
            throw new BadRequestException("OTP has expired. Please request a new one");
        }

        // Check max attempts
        if (verification.getAttempts() >= verification.getMaxAttempts()) {
            throw new BadRequestException("Maximum verification attempts exceeded. Please request a new OTP");
        }

        // Validate OTP hash
        String inputHash = tokenHashService.hash(plainOtp.trim());
        if (!verification.getOtpHash().equals(inputHash)) {
            verification.setAttempts(verification.getAttempts() + 1);
            otpRepository.save(verification);
            int remaining = verification.getMaxAttempts() - verification.getAttempts();
            throw new BadRequestException("Invalid OTP code. " + remaining + " attempts remaining");
        }

        // Successfully verified: atomically consume
        verification.setConsumedAt(now);
        otpRepository.save(verification);
        return true;
    }
}

