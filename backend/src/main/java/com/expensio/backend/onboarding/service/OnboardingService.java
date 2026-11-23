package com.expensio.backend.onboarding.service;

import com.expensio.backend.audit.AuditLog;
import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.auth.OnboardingSession;
import com.expensio.backend.auth.OnboardingSessionRepository;
import com.expensio.backend.auth.dto.UserDto;
import com.expensio.backend.auth.service.RefreshTokenService;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.exception.ConflictException;
import com.expensio.backend.exception.ResourceNotFoundException;
import com.expensio.backend.common.service.PhoneNormalizationService;
import com.expensio.backend.onboarding.*;
import com.expensio.backend.onboarding.dto.*;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.expensio.backend.username.UsernameGeneratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class OnboardingService {

    private static final Logger log = LoggerFactory.getLogger(OnboardingService.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserEmploymentRepository userEmploymentRepository;
    private final UserFinancialProfileRepository userFinancialProfileRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final UsernameGeneratorService usernameGeneratorService;
    private final PhoneNormalizationService phoneNormalizationService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public OnboardingService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserEmploymentRepository userEmploymentRepository,
            UserFinancialProfileRepository userFinancialProfileRepository,
            OnboardingSessionRepository onboardingSessionRepository,
            AuditLogRepository auditLogRepository,
            OutboxEventRepository outboxEventRepository,
            UsernameGeneratorService usernameGeneratorService,
            PhoneNormalizationService phoneNormalizationService,
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userEmploymentRepository = userEmploymentRepository;
        this.userFinancialProfileRepository = userFinancialProfileRepository;
        this.onboardingSessionRepository = onboardingSessionRepository;
        this.auditLogRepository = auditLogRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.usernameGeneratorService = usernameGeneratorService;
        this.phoneNormalizationService = phoneNormalizationService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    /**
     * 2.5 Onboarding Configuration
     */
    public OnboardingConfigResponse getConfig() {
        List<OnboardingConfigResponse.EmploymentTypeConfig> types = Arrays.stream(EmploymentType.values())
                .map(type -> new OnboardingConfigResponse.EmploymentTypeConfig(
                        type.name(),
                        type.getFieldLabel(),
                        type.getFieldName(),
                        true
                ))
                .toList();

        return new OnboardingConfigResponse(
                types,
                true,
                List.of("INR", "USD", "EUR", "GBP"),
                "INR",
                0L,
                100000000000L // 10 crore in minor units
        );
    }

    /**
     * 2.1 Onboarding Status Check
     */
    public OnboardingStatusResponse getStatus(UUID userId) {
        User user = getUser(userId);
        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        boolean employmentExists = userEmploymentRepository.existsById(userId);
        boolean financialProfileExists = userFinancialProfileRepository.existsById(userId);

        boolean isProfileComplete = profile != null && profile.isProfileComplete();
        boolean isEmailVerified = user.getEmail() != null && !user.getEmail().isBlank();
        boolean isPhoneVerified = user.getPhone() != null && !user.getPhone().isBlank();

        String currentStep;
        if (isProfileComplete) {
            currentStep = "COMPLETED";
        } else if (!employmentExists) {
            currentStep = "EMPLOYMENT";
        } else if (!financialProfileExists) {
            currentStep = "FINANCIAL_PROFILE";
        } else {
            currentStep = "READY_TO_COMPLETE";
        }

        return new OnboardingStatusResponse(
                currentStep,
                isEmailVerified,
                isPhoneVerified,
                isProfileComplete,
                employmentExists,
                financialProfileExists
        );
    }

    /**
     * 2.2 Profile Management
     */
    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request, String ipAddress) {
        User user = getUser(userId);

        String fullName = request.getFirstName().trim();
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            fullName += " " + request.getLastName().trim();
        }
        user.setName(fullName);

        // Optional phone update with normalization and collision check
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String normalizedPhone = phoneNormalizationService.normalizeToE164(request.getPhone(), request.getCountryCode());
            Optional<User> existingPhoneUser = userRepository.findByPhone(normalizedPhone);
            if (existingPhoneUser.isPresent() && !existingPhoneUser.get().getId().equals(userId)) {
                throw new ConflictException("Phone number already associated with another account");
            }
            user.setPhone(normalizedPhone);
        }

        // Optional email update with normalization and collision check
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            Optional<User> existingEmailUser = userRepository.findByEmailIgnoreCase(normalizedEmail);
            if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(userId)) {
                throw new ConflictException("Email already associated with another account");
            }
            user.setEmail(normalizedEmail);
        }

        user = userRepository.save(user);

        // Update onboarding session step if active
        onboardingSessionRepository.findByUserIdAndIsActiveTrue(userId).ifPresent(session -> {
            session.setCurrentStep("EMPLOYMENT");
            onboardingSessionRepository.save(session);
        });

        logAudit(userId, "ONBOARDING_PROFILE_UPDATED", "users", userId.toString(), ipAddress, "Profile updated during onboarding");

        return new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getName(), user.getStatus());
    }

    /**
     * 2.3 Employment Management
     */
    @Transactional
    public UserEmployment updateEmployment(UUID userId, UpdateEmploymentRequest request, String ipAddress) {
        getUser(userId);

        if (request.getMonthlyIncomeMinor() < 0) {
            throw new BadRequestException("Monthly income cannot be negative");
        }

        UserEmployment employment = userEmploymentRepository.findById(userId)
                .orElseGet(() -> new UserEmployment(userId, request.getEmploymentType(), request.getMonthlyIncomeMinor(), request.getCurrency()));

        employment.setEmploymentType(request.getEmploymentType());
        employment.setMonthlyIncomeMinor(request.getMonthlyIncomeMinor());
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            employment.setCurrency(request.getCurrency().toUpperCase());
        }

        employment = userEmploymentRepository.save(employment);

        onboardingSessionRepository.findByUserIdAndIsActiveTrue(userId).ifPresent(session -> {
            session.setCurrentStep("FINANCIAL_PROFILE");
            onboardingSessionRepository.save(session);
        });

        logAudit(userId, "ONBOARDING_EMPLOYMENT_UPDATED", "user_employment", userId.toString(), ipAddress,
                "Employment updated to " + request.getEmploymentType());

        return employment;
    }

    /**
     * 2.4 Initial Financial Profile
     */
    @Transactional
    public UserFinancialProfile updateFinancialProfile(UUID userId, UpdateFinancialProfileRequest request, String ipAddress) {
        getUser(userId);

        if (request.getCashBalanceMinor() < 0 || request.getSavingsBalanceMinor() < 0) {
            throw new BadRequestException("Balances cannot be negative");
        }

        UserFinancialProfile profile = userFinancialProfileRepository.findById(userId)
                .orElseGet(() -> new UserFinancialProfile(userId, request.getCashBalanceMinor(), request.getSavingsBalanceMinor(), request.getCurrency()));

        profile.setCashBalanceMinor(request.getCashBalanceMinor());
        profile.setSavingsBalanceMinor(request.getSavingsBalanceMinor());
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            profile.setCurrency(request.getCurrency().toUpperCase());
        }

        profile = userFinancialProfileRepository.save(profile);

        logAudit(userId, "ONBOARDING_FINANCIAL_PROFILE_UPDATED", "user_financial_profiles", userId.toString(), ipAddress,
                "Initial financial balances configured");

        return profile;
    }

    /**
     * 2.6 Onboarding Completion
     */
    @Transactional
    public OnboardingCompletionResponse completeOnboarding(UUID userId, String ipAddress, String deviceInfo) {
        User user = getUser(userId);
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseGet(() -> new UserProfile(userId));

        // Idempotency: if already completed, return active session
        if (profile.isProfileComplete()) {
            String accessToken = jwtService.generateToken(userId, "APPLICATION");
            String refreshToken = refreshTokenService.createRefreshToken(userId, deviceInfo, ipAddress);
            UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getName(), user.getStatus());
            return new OnboardingCompletionResponse(profile.getUsername(), userDto, accessToken, refreshToken, "APPLICATION", "Onboarding already completed");
        }

        // Validate prerequisite steps are completed
        if (!userEmploymentRepository.existsById(userId)) {
            throw new BadRequestException("Employment details must be completed before finishing onboarding");
        }
        if (!userFinancialProfileRepository.existsById(userId)) {
            throw new BadRequestException("Financial profile must be completed before finishing onboarding");
        }

        // 3.1 Generate unique username
        String[] nameParts = user.getName().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";
        String assignedUsername = usernameGeneratorService.generateUsername(firstName, lastName);

        profile.setUsername(assignedUsername);
        profile.setProfileComplete(true);
        userProfileRepository.save(profile);

        // Activate User Account
        user.setStatusEnum(AccountStatus.ACTIVE);
        user = userRepository.save(user);

        // Close onboarding session
        onboardingSessionRepository.findByUserIdAndIsActiveTrue(userId).ifPresent(session -> {
            session.setCurrentStep("COMPLETED");
            session.setActive(false);
            onboardingSessionRepository.save(session);
        });

        // Publish Outbox Event for Reliability (Phase 8)
        String outboxPayload = String.format("{\"userId\":\"%s\",\"username\":\"%s\",\"email\":\"%s\",\"timestamp\":\"%s\"}",
                user.getId(), assignedUsername, user.getEmail(), Instant.now());
        outboxEventRepository.save(new OutboxEvent("USER", user.getId().toString(), "USER_ONBOARDED", outboxPayload));

        // Audit Log
        logAudit(userId, "ONBOARDING_COMPLETED", "user_profiles", userId.toString(), ipAddress,
                "User successfully completed onboarding with username: " + assignedUsername);

        // Issue APPLICATION token session
        String accessToken = jwtService.generateToken(userId, "APPLICATION");
        String refreshToken = refreshTokenService.createRefreshToken(userId, deviceInfo, ipAddress);
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getPhone(), user.getName(), user.getStatus());

        return new OnboardingCompletionResponse(
                assignedUsername,
                userDto,
                accessToken,
                refreshToken,
                "APPLICATION",
                "Onboarding completed successfully"
        );
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private void logAudit(UUID userId, String action, String entityType, String entityId, String ipAddress, String details) {
        AuditLog logEntry = new AuditLog(userId, action, entityType, entityId, ipAddress, details);
        auditLogRepository.save(logEntry);
    }
}
