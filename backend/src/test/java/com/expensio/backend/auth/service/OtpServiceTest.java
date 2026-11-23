package com.expensio.backend.auth.service;

import com.expensio.backend.auth.OtpVerification;
import com.expensio.backend.auth.OtpVerificationRepository;
import com.expensio.backend.communication.EmailService;
import com.expensio.backend.communication.SmsService;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.security.TokenHashService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class OtpServiceTest {

    private final Map<String, OtpVerification> databaseByChallenge = new HashMap<>();
    private final List<OtpVerification> databaseList = new ArrayList<>();
    private final List<String> sentEmails = new ArrayList<>();
    private final List<String> sentSms = new ArrayList<>();

    private OtpVerificationRepository otpRepository;
    private EmailService emailService;
    private SmsService smsService;
    private TokenHashService tokenHashService;
    private OtpService otpService;

    @BeforeEach
    void setUp() {
        databaseByChallenge.clear();
        databaseList.clear();
        sentEmails.clear();
        sentSms.clear();

        otpRepository = (OtpVerificationRepository) Proxy.newProxyInstance(
                OtpVerificationRepository.class.getClassLoader(),
                new Class<?>[]{OtpVerificationRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("save".equals(methodName)) {
                        OtpVerification entity = (OtpVerification) args[0];
                        if (entity.getId() == null) {
                            entity.setId(UUID.randomUUID());
                        }
                        databaseList.add(entity);
                        if (entity.getChallengeId() != null) {
                            databaseByChallenge.put(entity.getChallengeId(), entity);
                        }
                        return entity;
                    } else if ("findByChallengeId".equals(methodName)) {
                        String cid = (String) args[0];
                        return Optional.ofNullable(databaseByChallenge.get(cid));
                    } else if ("findTopByTargetIdentifierAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc".equals(methodName)) {
                        String target = (String) args[0];
                        String purpose = (String) args[1];
                        return databaseList.stream()
                                .filter(o -> target.equalsIgnoreCase(o.getTargetIdentifier())
                                        && purpose.equalsIgnoreCase(o.getPurpose())
                                        && o.getConsumedAt() == null)
                                .reduce((first, second) -> second);
                    }
                    return null;
                }
        );

        emailService = new EmailService() {
            @Override
            public void sendOtpEmail(String recipientEmail, String otp, int validityMinutes) {
                sentEmails.add(recipientEmail + ":" + otp);
            }
            @Override public void sendPasswordResetEmail(String recipientEmail, String resetToken, int validityMinutes) {}
            @Override public void sendSecurityAlert(String recipientEmail, String subject, String message) {}
        };

        smsService = (recipientPhone, otp, validityMinutes) -> sentSms.add(recipientPhone + ":" + otp);

        tokenHashService = new TokenHashService();
        otpService = new OtpService(otpRepository, tokenHashService, emailService, smsService);
    }

    @Test
    @DisplayName("Should generate and dispatch OTP challenge for email")
    void testStartEmailChallenge() {
        OtpService.OtpChallengeResult result = otpService.startChallenge(
                OtpService.TARGET_EMAIL,
                "user@example.com",
                OtpService.PURPOSE_EMAIL_VERIFICATION,
                "127.0.0.1",
                "device-1"
        );

        assertNotNull(result.getChallengeId());
        assertEquals(300, result.getExpiresInSeconds());
        assertEquals(60, result.getResendCooldownSeconds());

        assertEquals(1, databaseList.size());
        OtpVerification saved = databaseList.get(0);
        assertEquals("EMAIL", saved.getTargetType());
        assertEquals("user@example.com", saved.getTargetIdentifier());
        assertNotNull(saved.getOtpHash());
        assertEquals(1, sentEmails.size());
        assertTrue(sentEmails.get(0).startsWith("user@example.com:"));
    }

    @Test
    @DisplayName("Should enforce resend cooldown")
    void testResendCooldownEnforcement() {
        OtpVerification activeChallenge = new OtpVerification("EMAIL", "user@example.com", "hash", "EMAIL_VERIFICATION", Instant.now().plus(5, ChronoUnit.MINUTES));
        activeChallenge.setResendAvailableAt(Instant.now().plus(45, ChronoUnit.SECONDS));
        databaseList.add(activeChallenge);

        assertThrows(BadRequestException.class, () -> otpService.startChallenge(
                OtpService.TARGET_EMAIL,
                "user@example.com",
                OtpService.PURPOSE_EMAIL_VERIFICATION,
                "127.0.0.1",
                "device-1"
        ));
    }

    @Test
    @DisplayName("Should verify valid OTP and consume atomically")
    void testVerifyValidOtp() {
        String plainOtp = "654321";
        String hashedOtp = tokenHashService.hash(plainOtp);

        OtpVerification challenge = new OtpVerification("EMAIL", "user@example.com", hashedOtp, "EMAIL_VERIFICATION", Instant.now().plus(5, ChronoUnit.MINUTES));
        challenge.setChallengeId("challenge-123");
        challenge.setMaxAttempts(5);
        challenge.setAttempts(0);
        databaseByChallenge.put("challenge-123", challenge);

        boolean verified = otpService.verifyChallenge("challenge-123", "user@example.com", "EMAIL_VERIFICATION", plainOtp);

        assertTrue(verified);
        assertNotNull(challenge.getConsumedAt());
    }

    @Test
    @DisplayName("Should increment attempts and lock on invalid OTP")
    void testVerifyInvalidOtpIncrementsAttempts() {
        String hashedOtp = tokenHashService.hash("654321");

        OtpVerification challenge = new OtpVerification("EMAIL", "user@example.com", hashedOtp, "EMAIL_VERIFICATION", Instant.now().plus(5, ChronoUnit.MINUTES));
        challenge.setChallengeId("challenge-123");
        challenge.setMaxAttempts(5);
        challenge.setAttempts(4); // 4 attempts already made
        databaseByChallenge.put("challenge-123", challenge);

        assertThrows(BadRequestException.class, () ->
                otpService.verifyChallenge("challenge-123", "user@example.com", "EMAIL_VERIFICATION", "000000")
        );

        assertEquals(5, challenge.getAttempts());
    }
}
