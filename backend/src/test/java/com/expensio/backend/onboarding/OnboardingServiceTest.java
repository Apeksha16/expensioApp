package com.expensio.backend.onboarding;

import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.auth.OnboardingSession;
import com.expensio.backend.auth.OnboardingSessionRepository;
import com.expensio.backend.auth.service.RefreshTokenService;
import com.expensio.backend.common.service.PhoneNormalizationService;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.onboarding.dto.*;
import com.expensio.backend.onboarding.service.OnboardingService;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.expensio.backend.username.UsernameGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OnboardingServiceTest {

    private final Map<UUID, User> userDb = new HashMap<>();
    private final Map<UUID, UserProfile> profileDb = new HashMap<>();
    private final Map<UUID, UserEmployment> employmentDb = new HashMap<>();
    private final Map<UUID, UserFinancialProfile> financialDb = new HashMap<>();
    private final List<OutboxEvent> outboxList = new ArrayList<>();

    private OnboardingService onboardingService;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        userDb.clear();
        profileDb.clear();
        employmentDb.clear();
        financialDb.clear();
        outboxList.clear();

        testUserId = UUID.randomUUID();
        User testUser = new User("+919876543210", "alan.doe@example.com", "Alan Doe");
        testUser.setId(testUserId);
        testUser.setStatusEnum(AccountStatus.PENDING_ONBOARDING);
        userDb.put(testUserId, testUser);

        UserProfile testProfile = new UserProfile(testUserId);
        profileDb.put(testUserId, testProfile);

        UserRepository userRepo = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.ofNullable(userDb.get(args[0]));
                    }
                    if ("save".equals(method.getName())) {
                        User u = (User) args[0];
                        if (u.getId() == null) u.setId(UUID.randomUUID());
                        userDb.put(u.getId(), u);
                        return u;
                    }
                    if ("findByPhone".equals(method.getName())) {
                        return userDb.values().stream().filter(u -> Objects.equals(u.getPhone(), args[0])).findFirst();
                    }
                    if ("findByEmailIgnoreCase".equals(method.getName())) {
                        return userDb.values().stream().filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase((String) args[0])).findFirst();
                    }
                    return null;
                }
        );

        UserProfileRepository profileRepo = (UserProfileRepository) Proxy.newProxyInstance(
                UserProfileRepository.class.getClassLoader(), new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.ofNullable(profileDb.get(args[0]));
                    }
                    if ("save".equals(method.getName())) {
                        UserProfile p = (UserProfile) args[0];
                        profileDb.put(p.getUserId(), p);
                        return p;
                    }
                    if ("existsByUsernameIgnoreCase".equals(method.getName())) {
                        return profileDb.values().stream().anyMatch(p -> p.getUsername() != null && p.getUsername().equalsIgnoreCase((String) args[0]));
                    }
                    return null;
                }
        );

        UserEmploymentRepository employmentRepo = (UserEmploymentRepository) Proxy.newProxyInstance(
                UserEmploymentRepository.class.getClassLoader(), new Class<?>[]{UserEmploymentRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.ofNullable(employmentDb.get(args[0]));
                    }
                    if ("existsById".equals(method.getName())) {
                        return employmentDb.containsKey(args[0]);
                    }
                    if ("save".equals(method.getName())) {
                        UserEmployment e = (UserEmployment) args[0];
                        employmentDb.put(e.getUserId(), e);
                        return e;
                    }
                    return null;
                }
        );

        UserFinancialProfileRepository financialRepo = (UserFinancialProfileRepository) Proxy.newProxyInstance(
                UserFinancialProfileRepository.class.getClassLoader(), new Class<?>[]{UserFinancialProfileRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.ofNullable(financialDb.get(args[0]));
                    }
                    if ("existsById".equals(method.getName())) {
                        return financialDb.containsKey(args[0]);
                    }
                    if ("save".equals(method.getName())) {
                        UserFinancialProfile f = (UserFinancialProfile) args[0];
                        financialDb.put(f.getUserId(), f);
                        return f;
                    }
                    return null;
                }
        );

        OnboardingSessionRepository sessionRepo = (OnboardingSessionRepository) Proxy.newProxyInstance(
                OnboardingSessionRepository.class.getClassLoader(), new Class<?>[]{OnboardingSessionRepository.class},
                (proxy, method, args) -> {
                    if ("findByUserIdAndIsActiveTrue".equals(method.getName())) {
                        return Optional.empty();
                    }
                    return null;
                }
        );

        AuditLogRepository auditRepo = (AuditLogRepository) Proxy.newProxyInstance(
                AuditLogRepository.class.getClassLoader(), new Class<?>[]{AuditLogRepository.class},
                (proxy, method, args) -> null
        );

        OutboxEventRepository outboxRepo = (OutboxEventRepository) Proxy.newProxyInstance(
                OutboxEventRepository.class.getClassLoader(), new Class<?>[]{OutboxEventRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        outboxList.add((OutboxEvent) args[0]);
                        return args[0];
                    }
                    return null;
                }
        );

        UsernameGeneratorService usernameGen = new UsernameGeneratorService(profileRepo);
        PhoneNormalizationService phoneService = new PhoneNormalizationService();

        JwtProperties jwtProps = new JwtProperties();
        jwtProps.setSecret("01234567890123456789012345678901");
        JwtService jwtStub = new JwtService(jwtProps) {
            @Override
            public String generateToken(UUID userId, String tokenType) {
                return "mock_access_token_" + tokenType;
            }
        };

        RefreshTokenService refreshStub = new RefreshTokenService(null, null, null) {
            @Override
            public String createRefreshToken(UUID userId, String deviceInfo, String ipAddress) {
                return "mock_refresh_token";
            }
        };

        onboardingService = new OnboardingService(
                userRepo,
                profileRepo,
                employmentRepo,
                financialRepo,
                sessionRepo,
                auditRepo,
                outboxRepo,
                usernameGen,
                phoneService,
                jwtStub,
                refreshStub
        );
    }

    @Test
    @DisplayName("2.5 Get Config returns all 5 employment types and currency config")
    void getConfig_ReturnsSupportedTypes() {
        OnboardingConfigResponse config = onboardingService.getConfig();
        assertThat(config.getEmploymentTypes()).hasSize(5);
        assertThat(config.getDefaultCurrency()).isEqualTo("INR");
        assertThat(config.getSupportedCurrencies()).contains("INR", "USD");
        assertThat(config.isSavingsEligible()).isTrue();
    }

    @Test
    @DisplayName("2.1 Get Status tracks step progression correctly")
    void getStatus_ReflectsStepProgression() {
        OnboardingStatusResponse status = onboardingService.getStatus(testUserId);
        assertThat(status.getCurrentStep()).isEqualTo("EMPLOYMENT");
        assertThat(status.isEmploymentComplete()).isFalse();

        // Add employment
        employmentDb.put(testUserId, new UserEmployment(testUserId, EmploymentType.SALARIED, 10000000L, "INR"));
        OnboardingStatusResponse statusAfterEmployment = onboardingService.getStatus(testUserId);
        assertThat(statusAfterEmployment.getCurrentStep()).isEqualTo("FINANCIAL_PROFILE");

        // Add financial profile
        financialDb.put(testUserId, new UserFinancialProfile(testUserId, 500000L, 2000000L, "INR"));
        OnboardingStatusResponse statusAfterFinancial = onboardingService.getStatus(testUserId);
        assertThat(statusAfterFinancial.getCurrentStep()).isEqualTo("READY_TO_COMPLETE");
    }

    @Test
    @DisplayName("2.3 Update Employment validates and stores financial field in minor units")
    void updateEmployment_SavesSuccessfully() {
        UpdateEmploymentRequest req = new UpdateEmploymentRequest(EmploymentType.SALARIED, 5000000L, "INR");
        UserEmployment result = onboardingService.updateEmployment(testUserId, req, "127.0.0.1");

        assertThat(result.getEmploymentType()).isEqualTo(EmploymentType.SALARIED);
        assertThat(result.getMonthlyIncomeMinor()).isEqualTo(5000000L);
        assertThat(employmentDb.get(testUserId)).isNotNull();
    }

    @Test
    @DisplayName("2.4 Update Financial Profile rejects negative amounts")
    void updateFinancialProfile_RejectsNegativeAmount() {
        UpdateFinancialProfileRequest req = new UpdateFinancialProfileRequest(-100L, 200L, "INR");
        assertThatThrownBy(() -> onboardingService.updateFinancialProfile(testUserId, req, "127.0.0.1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Balances cannot be negative");
    }

    @Test
    @DisplayName("2.6 Complete Onboarding validates required fields, assigns username, and activates account")
    void completeOnboarding_SuccessfulFlow() {
        // Prepare prerequisites
        employmentDb.put(testUserId, new UserEmployment(testUserId, EmploymentType.SALARIED, 8000000L, "INR"));
        financialDb.put(testUserId, new UserFinancialProfile(testUserId, 1000000L, 5000000L, "INR"));

        OnboardingCompletionResponse response = onboardingService.completeOnboarding(testUserId, "127.0.0.1", "TestClient");

        assertThat(response.getUsername()).isEqualTo("alan");
        assertThat(response.getTokenType()).isEqualTo("APPLICATION");
        assertThat(userDb.get(testUserId).getStatusEnum()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(profileDb.get(testUserId).isProfileComplete()).isTrue();
        assertThat(outboxList).hasSize(1);
        assertThat(outboxList.get(0).getEventType()).isEqualTo("USER_ONBOARDED");
    }

    @Test
    @DisplayName("2.6 Complete Onboarding fails if employment is missing")
    void completeOnboarding_FailsWithoutEmployment() {
        financialDb.put(testUserId, new UserFinancialProfile(testUserId, 1000000L, 5000000L, "INR"));

        assertThatThrownBy(() -> onboardingService.completeOnboarding(testUserId, "127.0.0.1", "TestClient"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Employment details must be completed");
    }
}
