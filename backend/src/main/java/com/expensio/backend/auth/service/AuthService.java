package com.expensio.backend.auth.service;

import com.expensio.backend.audit.AuditLog;
import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.auth.*;
import com.expensio.backend.auth.dto.*;
import com.expensio.backend.common.service.PhoneNormalizationService;
import com.expensio.backend.communication.EmailService;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.exception.UnauthorizedException;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.security.PasswordPolicyService;
import com.expensio.backend.security.TokenHashService;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthIdentityRepository authIdentityRepository;
    private final CredentialRepository credentialRepository;
    private final TemporaryAuthTokenRepository temporaryAuthTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;
    private final PhoneNormalizationService phoneNormalizationService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final TokenHashService tokenHashService;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            AuthIdentityRepository authIdentityRepository,
            CredentialRepository credentialRepository,
            TemporaryAuthTokenRepository temporaryAuthTokenRepository,
            AuditLogRepository auditLogRepository,
            OtpService otpService,
            RefreshTokenService refreshTokenService,
            JwtService jwtService,
            JwtProperties jwtProperties,
            PasswordEncoder passwordEncoder,
            PasswordPolicyService passwordPolicyService,
            PhoneNormalizationService phoneNormalizationService,
            GoogleTokenVerifierService googleTokenVerifierService,
            TokenHashService tokenHashService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.credentialRepository = credentialRepository;
        this.temporaryAuthTokenRepository = temporaryAuthTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
        this.phoneNormalizationService = phoneNormalizationService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.tokenHashService = tokenHashService;
        this.emailService = emailService;
    }

    // =========================================================================
    // 1.1 Google Authentication
    // =========================================================================

    @Transactional
    public AuthResponse authenticateGoogle(GoogleAuthRequest request, String ipAddress, String deviceInfo) {
        GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verifyToken(request.getIdToken());
        String sub = googleUser.getSubject();
        String email = googleUser.getEmail();

        // 1. Check if identity link exists
        Optional<AuthIdentity> identityOpt = authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", sub);

        User user;
        if (identityOpt.isPresent()) {
            user = userRepository.findById(identityOpt.get().getUserId())
                    .orElseThrow(() -> new UnauthorizedException("User associated with Google identity not found"));
            checkAccountStatus(user);
        } else {
            // Check if existing user with matching verified email
            Optional<User> existingEmailUser = (email != null) ? userRepository.findByEmailIgnoreCase(email) : Optional.empty();
            if (existingEmailUser.isPresent()) {
                user = existingEmailUser.get();
                checkAccountStatus(user);
                // Link Google identity to existing user
                AuthIdentity newIdentity = new AuthIdentity(user.getId(), "GOOGLE", sub, email);
                authIdentityRepository.save(newIdentity);
                logAudit(user.getId(), "LINK_GOOGLE_IDENTITY", "auth_identities", newIdentity.getId().toString(), ipAddress, "Linked Google identity to existing email");
            } else {
                // Provision new user
                user = new User(null, email, googleUser.getName());
                user.setStatusEnum(AccountStatus.PENDING_ONBOARDING);
                user = userRepository.save(user);

                UserProfile profile = new UserProfile(user.getId());
                profile.setProfileComplete(false);
                userProfileRepository.save(profile);

                AuthIdentity newIdentity = new AuthIdentity(user.getId(), "GOOGLE", sub, email);
                authIdentityRepository.save(newIdentity);
                logAudit(user.getId(), "REGISTER_GOOGLE", "users", user.getId().toString(), ipAddress, "Registered new user via Google OAuth");
            }
        }

        return createAuthResponse(user, ipAddress, deviceInfo, "Google authentication successful");
    }

    // =========================================================================
    // 1.2 Email Registration
    // =========================================================================

    @Transactional
    public OtpResponse registerEmail(EmailSignupRequest request, String ipAddress, String deviceId) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        passwordPolicyService.validatePassword(request.getPassword());

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.getStatusEnum() == AccountStatus.ACTIVE) {
                // Return generic response without revealing account existence
                log.info("Signup attempted for already registered email: {}", normalizedEmail);
                return new OtpResponse(UUID.randomUUID().toString(), 300, 60, "If your email is eligible, a verification code has been sent.");
            }
            // If in pending verification state, update credentials and resend OTP
            String hashedPwd = passwordEncoder.encode(request.getPassword());
            credentialRepository.findByUserId(existing.getId()).ifPresentOrElse(
                    cred -> {
                        cred.setPasswordHash(hashedPwd);
                        credentialRepository.save(cred);
                    },
                    () -> credentialRepository.save(new Credential(existing.getId(), hashedPwd))
            );
            OtpService.OtpChallengeResult challenge = otpService.startChallenge(
                    OtpService.TARGET_EMAIL,
                    normalizedEmail,
                    OtpService.PURPOSE_EMAIL_VERIFICATION,
                    ipAddress,
                    deviceId
            );
            return new OtpResponse(challenge.getChallengeId(), challenge.getExpiresInSeconds(), challenge.getResendCooldownSeconds(), "Verification OTP sent to your email.");
        }

        // Create new pending user
        User newUser = new User(null, normalizedEmail, request.getName().trim());
        newUser.setStatusEnum(AccountStatus.PENDING_VERIFICATION);
        newUser = userRepository.save(newUser);

        UserProfile profile = new UserProfile(newUser.getId());
        profile.setProfileComplete(false);
        userProfileRepository.save(profile);

        // Store Argon2id password hash
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        Credential credential = new Credential(newUser.getId(), hashedPassword);
        credentialRepository.save(credential);

        // Send OTP verification
        OtpService.OtpChallengeResult challenge = otpService.startChallenge(
                OtpService.TARGET_EMAIL,
                normalizedEmail,
                OtpService.PURPOSE_EMAIL_VERIFICATION,
                ipAddress,
                deviceId
        );

        logAudit(newUser.getId(), "SIGNUP_EMAIL_INITIATED", "users", newUser.getId().toString(), ipAddress, "Email signup initiated pending OTP verification");

        return new OtpResponse(challenge.getChallengeId(), challenge.getExpiresInSeconds(), challenge.getResendCooldownSeconds(), "Verification OTP sent to your email.");
    }

    // =========================================================================
    // 1.3 Email Login
    // =========================================================================

    @Transactional
    public AuthResponse loginEmail(EmailLoginRequest request, String ipAddress, String deviceInfo) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        Credential credential = credentialRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // Check temporary lockout
        if (credential.getLockoutExpiresAt() != null) {
            if (credential.getLockoutExpiresAt().isAfter(Instant.now())) {
                logAudit(user.getId(), "LOGIN_BLOCKED_LOCKED", "credentials", user.getId().toString(), ipAddress, "Login attempt during active lockout");
                throw new UnauthorizedException("Account is temporarily locked due to consecutive failed attempts. Please try again later.");
            } else {
                // Lockout period has elapsed, reset counter
                credential.setFailedAttempts(0);
                credential.setLockoutExpiresAt(null);
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), credential.getPasswordHash())) {
            int newAttempts = credential.getFailedAttempts() + 1;
            credential.setFailedAttempts(newAttempts);
            if (newAttempts >= 5) {
                credential.setLockoutExpiresAt(Instant.now().plus(java.time.Duration.ofMinutes(15)));
                credentialRepository.save(credential);
                logAudit(user.getId(), "ACCOUNT_TEMPORARILY_LOCKED", "credentials", user.getId().toString(), ipAddress, "Account locked for 15 minutes after 5 consecutive failed attempts");
                throw new UnauthorizedException("Too many failed login attempts. Account is temporarily locked for 15 minutes.");
            }
            credentialRepository.save(credential);
            logAudit(user.getId(), "LOGIN_FAILED", "credentials", user.getId().toString(), ipAddress, "Failed password attempt " + newAttempts);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Reset failed attempts on successful match
        if (credential.getFailedAttempts() > 0 || credential.getLockoutExpiresAt() != null) {
            credential.setFailedAttempts(0);
            credential.setLockoutExpiresAt(null);
            credentialRepository.save(credential);
        }

        checkAccountStatus(user);

        logAudit(user.getId(), "LOGIN_SUCCESS_EMAIL", "users", user.getId().toString(), ipAddress, "Successful email login");
        return createAuthResponse(user, ipAddress, deviceInfo, "Login successful");
    }

    // =========================================================================
    // 1.4 Mobile Registration and Login
    // =========================================================================

    @Transactional
    public OtpResponse startMobileOtp(MobileOtpStartRequest request, String ipAddress, String deviceId) {
        String normalizedPhone = phoneNormalizationService.normalizeToE164(request.getPhone(), request.getCountryCode());

        OtpService.OtpChallengeResult challenge = otpService.startChallenge(
                OtpService.TARGET_PHONE,
                normalizedPhone,
                OtpService.PURPOSE_MOBILE_LOGIN,
                ipAddress,
                deviceId
        );

        return new OtpResponse(challenge.getChallengeId(), challenge.getExpiresInSeconds(), challenge.getResendCooldownSeconds(), "OTP sent to your mobile number.");
    }

    @Transactional
    public AuthResponse verifyMobileOtp(MobileOtpVerifyRequest request, String ipAddress, String deviceInfo) {
        String normalizedPhone = phoneNormalizationService.normalizeToE164(request.getPhone(), request.getCountryCode());

        otpService.verifyChallenge(
                request.getChallengeId(),
                normalizedPhone,
                OtpService.PURPOSE_MOBILE_LOGIN,
                request.getOtp()
        );

        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            checkAccountStatus(user);
            logAudit(user.getId(), "LOGIN_SUCCESS_MOBILE", "users", user.getId().toString(), ipAddress, "Successful mobile OTP login");
        } else {
            // Provision new mobile user
            String name = (request.getName() != null && !request.getName().isBlank()) ? request.getName().trim() : "Expensio User";
            user = new User(normalizedPhone, null, name);
            user.setStatusEnum(AccountStatus.PENDING_ONBOARDING);
            user = userRepository.save(user);

            UserProfile profile = new UserProfile(user.getId());
            profile.setProfileComplete(false);
            userProfileRepository.save(profile);

            AuthIdentity identity = new AuthIdentity(user.getId(), "PHONE", normalizedPhone, null);
            authIdentityRepository.save(identity);

            logAudit(user.getId(), "REGISTER_MOBILE", "users", user.getId().toString(), ipAddress, "Registered new user via mobile OTP");
        }

        return createAuthResponse(user, ipAddress, deviceInfo, "Mobile authentication successful");
    }

    // =========================================================================
    // 1.7 Password Recovery
    // =========================================================================

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress, String deviceId) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", normalizedEmail);
            return; // Return silently to prevent enumeration
        }

        User user = userOpt.get();
        if (user.getStatusEnum() == AccountStatus.LOCKED || user.getStatusEnum() == AccountStatus.DISABLED) {
            log.warn("Password reset requested for inactive account ID: {}", user.getId());
            return;
        }

        // Issue temporary reset token
        String rawToken = tokenHashService.generateSecureRandomToken(32);
        String tokenHash = tokenHashService.hash(rawToken);
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        TemporaryAuthToken resetToken = new TemporaryAuthToken(user.getId(), tokenHash, normalizedEmail, "RECOVERY", expiresAt);
        temporaryAuthTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(normalizedEmail, rawToken, 15);
        logAudit(user.getId(), "FORGOT_PASSWORD_REQUESTED", "temporary_auth_tokens", resetToken.getId().toString(), ipAddress, "Password reset token dispatched");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress) {
        passwordPolicyService.validatePassword(request.getNewPassword());

        User user = null;

        // Path A: via reset token
        if (request.getToken() != null && !request.getToken().isBlank()) {
            String tokenHash = tokenHashService.hash(request.getToken().trim());
            TemporaryAuthToken tempToken = temporaryAuthTokenRepository.findByTokenHash(tokenHash)
                    .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

            if (tempToken.getConsumedAt() != null) {
                throw new BadRequestException("This password reset token has already been used");
            }
            if (Instant.now().isAfter(tempToken.getExpiresAt())) {
                throw new BadRequestException("Password reset token has expired");
            }

            user = userRepository.findById(tempToken.getUserId())
                    .orElseThrow(() -> new BadRequestException("User not found"));

            tempToken.setConsumedAt(Instant.now());
            temporaryAuthTokenRepository.save(tempToken);
        }
        // Path B: via email + OTP
        else if (request.getEmail() != null && request.getOtp() != null) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            otpService.verifyChallenge(null, normalizedEmail, OtpService.PURPOSE_PASSWORD_RESET, request.getOtp());

            user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .orElseThrow(() -> new BadRequestException("User not found"));
        } else {
            throw new BadRequestException("Either a reset token or email + OTP is required");
        }

        // Hash new password with Argon2id
        String newHash = passwordEncoder.encode(request.getNewPassword());
        final User finalUser = user;
        credentialRepository.findByUserId(user.getId()).ifPresentOrElse(
                cred -> {
                    cred.setPasswordHash(newHash);
                    credentialRepository.save(cred);
                },
                () -> credentialRepository.save(new Credential(finalUser.getId(), newHash))
        );

        // Security rule: Revoke all existing sessions
        refreshTokenService.revokeAllUserSessions(user.getId());

        emailService.sendSecurityAlert(
                user.getEmail(),
                "Security Alert: Your Expensio password was changed",
                "Your password was recently changed. If you did not make this change, please contact support immediately."
        );

        logAudit(user.getId(), "PASSWORD_RESET_SUCCESS", "credentials", user.getId().toString(), ipAddress, "Password reset successfully completed and all sessions revoked");
    }

    // =========================================================================
    // Refresh & Logout
    // =========================================================================

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress, String deviceInfo) {
        RefreshTokenService.RotationResult rotated = refreshTokenService.rotateRefreshToken(
                request.getRefreshToken(),
                deviceInfo,
                ipAddress
        );

        User user = userRepository.findById(rotated.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        checkAccountStatus(user);

        boolean isProfileComplete = userProfileRepository.findById(user.getId())
                .map(UserProfile::isProfileComplete)
                .orElse(false);

        String tokenType = isProfileComplete ? "APPLICATION" : "ONBOARDING";
        String accessToken = jwtService.generateToken(user.getId(), tokenType);

        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getName(), user.getStatus());
        String onboardingStatus = isProfileComplete ? "COMPLETED" : "PENDING_ONBOARDING";

        return new AuthResponse(
                accessToken,
                rotated.getNewRawRefreshToken(),
                tokenType,
                jwtProperties.getAccessTokenExpirationMs(),
                userDto,
                onboardingStatus,
                isProfileComplete,
                "Token refreshed successfully"
        );
    }

    @Transactional
    public void logout(String rawRefreshToken, UUID userId, String ipAddress) {
        refreshTokenService.revokeToken(rawRefreshToken);
        if (userId != null) {
            logAudit(userId, "LOGOUT", "refresh_tokens", null, ipAddress, "Current session logged out");
        }
    }

    @Transactional
    public void logoutAll(UUID userId, String ipAddress) {
        if (userId != null) {
            refreshTokenService.revokeAllUserSessions(userId);
            logAudit(userId, "LOGOUT_ALL", "refresh_tokens", null, ipAddress, "All active sessions logged out");
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private void checkAccountStatus(User user) {
        AccountStatus status = user.getStatusEnum();
        if (status == AccountStatus.LOCKED) {
            throw new UnauthorizedException("Account is locked. Please contact support.");
        }
        if (status == AccountStatus.DISABLED) {
            throw new UnauthorizedException("Account has been disabled.");
        }
        if (status == AccountStatus.DELETION_PENDING) {
            throw new UnauthorizedException("Account is pending deletion.");
        }
    }

    private AuthResponse createAuthResponse(User user, String ipAddress, String deviceInfo, String message) {
        boolean isProfileComplete = userProfileRepository.findById(user.getId())
                .map(UserProfile::isProfileComplete)
                .orElse(false);

        String tokenType = isProfileComplete ? "APPLICATION" : "ONBOARDING";
        String accessToken = jwtService.generateToken(user.getId(), tokenType);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user.getId(), deviceInfo, ipAddress);

        String onboardingStatus = isProfileComplete ? "COMPLETED" : "PENDING_ONBOARDING";
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getName(), user.getStatus());

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                tokenType,
                jwtProperties.getAccessTokenExpirationMs(),
                userDto,
                onboardingStatus,
                isProfileComplete,
                message
        );
    }

    private void logAudit(UUID userId, String action, String entityType, String entityId, String ipAddress, String details) {
        try {
            AuditLog auditLog = new AuditLog(userId, action, entityType, entityId, ipAddress, details);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}

