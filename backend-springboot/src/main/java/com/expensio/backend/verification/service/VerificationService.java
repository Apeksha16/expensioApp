package com.expensio.backend.verification.service;

import com.expensio.backend.auth.dto.OtpResponse;
import com.expensio.backend.auth.service.OtpService;
import com.expensio.backend.common.service.PhoneNormalizationService;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.expensio.backend.verification.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerificationService {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PhoneNormalizationService phoneNormalizationService;

    public VerificationService(
            OtpService otpService,
            UserRepository userRepository,
            PhoneNormalizationService phoneNormalizationService) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.phoneNormalizationService = phoneNormalizationService;
    }

    @Transactional
    public OtpResponse startEmailVerification(EmailVerificationStartRequest request, String ipAddress, String deviceId) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        OtpService.OtpChallengeResult result = otpService.startChallenge(
                OtpService.TARGET_EMAIL,
                normalizedEmail,
                OtpService.PURPOSE_EMAIL_VERIFICATION,
                ipAddress,
                deviceId
        );
        return new OtpResponse(result.getChallengeId(), result.getExpiresInSeconds(), result.getResendCooldownSeconds(), "Verification OTP sent to email");
    }

    @Transactional
    public boolean verifyEmail(EmailVerificationVerifyRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        boolean verified = otpService.verifyChallenge(
                request.getChallengeId(),
                normalizedEmail,
                OtpService.PURPOSE_EMAIL_VERIFICATION,
                request.getOtp()
        );

        if (verified) {
            userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
                if (user.getStatusEnum() == AccountStatus.PENDING_VERIFICATION) {
                    user.setStatusEnum(AccountStatus.PENDING_ONBOARDING);
                    userRepository.save(user);
                }
            });
        }
        return verified;
    }

    @Transactional
    public OtpResponse startMobileVerification(MobileVerificationStartRequest request, String ipAddress, String deviceId) {
        String normalizedPhone = phoneNormalizationService.normalizeToE164(request.getPhone(), request.getCountryCode());
        OtpService.OtpChallengeResult result = otpService.startChallenge(
                OtpService.TARGET_PHONE,
                normalizedPhone,
                OtpService.PURPOSE_MOBILE_VERIFICATION,
                ipAddress,
                deviceId
        );
        return new OtpResponse(result.getChallengeId(), result.getExpiresInSeconds(), result.getResendCooldownSeconds(), "Verification OTP sent to mobile");
    }

    @Transactional
    public boolean verifyMobile(MobileVerificationVerifyRequest request) {
        String normalizedPhone = phoneNormalizationService.normalizeToE164(request.getPhone(), request.getCountryCode());
        return otpService.verifyChallenge(
                request.getChallengeId(),
                normalizedPhone,
                OtpService.PURPOSE_MOBILE_VERIFICATION,
                request.getOtp()
        );
    }
}

