package com.expensio.backend.auth.service;

import com.expensio.backend.audit.AuditLog;
import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.auth.*;
import com.expensio.backend.auth.dto.*;
import com.expensio.backend.common.service.PhoneNormalizationService;
import com.expensio.backend.communication.EmailService;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    private final Map<UUID, User> usersById = new HashMap<>();
    private final Map<String, User> usersByEmail = new HashMap<>();
    private final Map<String, User> usersByPhone = new HashMap<>();
    private final Map<UUID, UserProfile> profilesByUserId = new HashMap<>();
    private final Map<UUID, Credential> credentialsByUserId = new HashMap<>();
    private final Map<String, AuthIdentity> identitiesByKey = new HashMap<>();
    private final List<AuditLog> auditLogs = new ArrayList<>();

    private UserRepository userRepository;
    private UserProfileRepository userProfileRepository;
    private AuthIdentityRepository authIdentityRepository;
    private CredentialRepository credentialRepository;
    private TemporaryAuthTokenRepository temporaryAuthTokenRepository;
    private AuditLogRepository auditLogRepository;
    private OtpVerificationRepository otpRepository;
    private RefreshTokenRepository refreshTokenRepository;

    private OtpService otpService;
    private RefreshTokenService refreshTokenService;
    private JwtService jwtService;
    private AuthService authService;
    private TokenHashService tokenHashService;
    private PasswordEncoder passwordEncoder;
    private PasswordPolicyService passwordPolicyService;
    private PhoneNormalizationService phoneNormalizationService;
    private GoogleTokenVerifierService googleTokenVerifierService;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        usersById.clear();
        usersByEmail.clear();
        usersByPhone.clear();
        profilesByUserId.clear();
        credentialsByUserId.clear();
        identitiesByKey.clear();
        auditLogs.clear();

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        User u = (User) args[0];
                        if (u.getId() == null) {
                            u.setId(UUID.randomUUID());
                        }
                        usersById.put(u.getId(), u);
                        if (u.getEmail() != null) usersByEmail.put(u.getEmail().toLowerCase(), u);
                        if (u.getPhone() != null) usersByPhone.put(u.getPhone(), u);
                        return u;
                    } else if ("findById".equals(name)) {
                        return Optional.ofNullable(usersById.get((UUID) args[0]));
                    } else if ("findByEmailIgnoreCase".equals(name)) {
                        String email = ((String) args[0]).toLowerCase();
                        return Optional.ofNullable(usersByEmail.get(email));
                    } else if ("findByPhone".equals(name)) {
                        return Optional.ofNullable(usersByPhone.get((String) args[0]));
                    }
                    return null;
                }
        );

        userProfileRepository = (UserProfileRepository) Proxy.newProxyInstance(
                UserProfileRepository.class.getClassLoader(),
                new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        UserProfile p = (UserProfile) args[0];
                        profilesByUserId.put(p.getUserId(), p);
                        return p;
                    } else if ("findById".equals(name)) {
                        return Optional.ofNullable(profilesByUserId.get((UUID) args[0]));
                    }
                    return null;
                }
        );

        authIdentityRepository = (AuthIdentityRepository) Proxy.newProxyInstance(
                AuthIdentityRepository.class.getClassLoader(),
                new Class<?>[]{AuthIdentityRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        AuthIdentity id = (AuthIdentity) args[0];
                        identitiesByKey.put(id.getProvider() + ":" + id.getProviderSubject(), id);
                        return id;
                    } else if ("findByProviderAndProviderSubject".equals(name)) {
                        String key = args[0] + ":" + args[1];
                        return Optional.ofNullable(identitiesByKey.get(key));
                    }
                    return null;
                }
        );

        credentialRepository = (CredentialRepository) Proxy.newProxyInstance(
                CredentialRepository.class.getClassLoader(),
                new Class<?>[]{CredentialRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("save".equals(name)) {
                        Credential c = (Credential) args[0];
                        credentialsByUserId.put(c.getUserId(), c);
                        return c;
                    } else if ("findByUserId".equals(name)) {
                        return Optional.ofNullable(credentialsByUserId.get((UUID) args[0]));
                    }
                    return null;
                }
        );

        temporaryAuthTokenRepository = (TemporaryAuthTokenRepository) Proxy.newProxyInstance(
                TemporaryAuthTokenRepository.class.getClassLoader(),
                new Class<?>[]{TemporaryAuthTokenRepository.class},
                (proxy, method, args) -> null
        );

        auditLogRepository = (AuditLogRepository) Proxy.newProxyInstance(
                AuditLogRepository.class.getClassLoader(),
                new Class<?>[]{AuditLogRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        auditLogs.add((AuditLog) args[0]);
                        return args[0];
                    }
                    return null;
                }
        );

        otpRepository = (OtpVerificationRepository) Proxy.newProxyInstance(
                OtpVerificationRepository.class.getClassLoader(),
                new Class<?>[]{OtpVerificationRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        refreshTokenRepository = (RefreshTokenRepository) Proxy.newProxyInstance(
                RefreshTokenRepository.class.getClassLoader(),
                new Class<?>[]{RefreshTokenRepository.class},
                (proxy, method, args) -> null
        );

        tokenHashService = new TokenHashService();
        emailService = new EmailService() {
            @Override public void sendOtpEmail(String recipientEmail, String otp, int validityMinutes) {}
            @Override public void sendPasswordResetEmail(String recipientEmail, String resetToken, int validityMinutes) {}
            @Override public void sendSecurityAlert(String recipientEmail, String subject, String message) {}
        };

        passwordEncoder = new PasswordEncoder() {
            @Override public String encode(CharSequence rawPassword) { return "hashed:" + rawPassword; }
            @Override public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return ("hashed:" + rawPassword).equals(encodedPassword);
            }
        };

        passwordPolicyService = new PasswordPolicyService();
        phoneNormalizationService = new PhoneNormalizationService();
        googleTokenVerifierService = new GoogleTokenVerifierService("test-client-id");

        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("super_secure_test_secret_key_with_at_least_256_bits_length!");
        jwtProperties.setAccessTokenExpirationMs(86400000L);
        jwtProperties.setRefreshTokenExpirationMs(2592000000L);
        jwtProperties.setIssuer("expensio-api");

        jwtService = new JwtService(jwtProperties);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, tokenHashService, jwtProperties);
        otpService = new OtpService(otpRepository, tokenHashService, emailService, (p, o, v) -> {});

        authService = new AuthService(
                userRepository,
                userProfileRepository,
                authIdentityRepository,
                credentialRepository,
                temporaryAuthTokenRepository,
                auditLogRepository,
                otpService,
                refreshTokenService,
                jwtService,
                jwtProperties,
                passwordEncoder,
                passwordPolicyService,
                phoneNormalizationService,
                googleTokenVerifierService,
                tokenHashService,
                emailService
        );
    }

    @Test
    @DisplayName("Google Auth: Should provision new user in PENDING_ONBOARDING state with restricted token")
    void testGoogleAuthNewUser() {
        GoogleAuthRequest request = new GoogleAuthRequest("mock_google_john123");
        AuthResponse response = authService.authenticateGoogle(request, "127.0.0.1", "Chrome");

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("ONBOARDING", response.getTokenType());
        assertEquals("PENDING_ONBOARDING", response.getOnboardingStatus());
        assertFalse(response.isProfileComplete());

        assertEquals(1, usersById.size());
        User created = usersById.values().iterator().next();
        assertEquals("john123@gmail.com", created.getEmail());
        assertEquals(AccountStatus.PENDING_ONBOARDING, created.getStatusEnum());
        assertTrue(identitiesByKey.containsKey("GOOGLE:google_sub_john123"));
    }

    @Test
    @DisplayName("Email Signup: Should validate password and create user in PENDING_VERIFICATION")
    void testEmailSignup() {
        EmailSignupRequest request = new EmailSignupRequest("test@expensio.app", "P@ssword123", "Test User");

        OtpResponse response = authService.registerEmail(request, "127.0.0.1", "device-1");

        assertNotNull(response);
        assertEquals(1, usersById.size());
        User created = usersById.values().iterator().next();
        assertEquals("test@expensio.app", created.getEmail());
        assertEquals(AccountStatus.PENDING_VERIFICATION, created.getStatusEnum());

        Credential cred = credentialsByUserId.get(created.getId());
        assertNotNull(cred);
        assertEquals("hashed:P@ssword123", cred.getPasswordHash());
    }

    @Test
    @DisplayName("Email Login: Should authenticate active user and return full application session")
    void testEmailLoginActiveUser() {
        User user = new User(null, "active@expensio.app", "Active User");
        user.setId(UUID.randomUUID());
        user.setStatusEnum(AccountStatus.ACTIVE);
        usersById.put(user.getId(), user);
        usersByEmail.put(user.getEmail(), user);

        Credential cred = new Credential(user.getId(), "hashed:P@ssword123");
        credentialsByUserId.put(user.getId(), cred);

        UserProfile profile = new UserProfile(user.getId());
        profile.setProfileComplete(true);
        profilesByUserId.put(user.getId(), profile);

        EmailLoginRequest request = new EmailLoginRequest("active@expensio.app", "P@ssword123");
        AuthResponse response = authService.loginEmail(request, "127.0.0.1", "device-1");

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("APPLICATION", response.getTokenType());
        assertEquals("COMPLETED", response.getOnboardingStatus());
        assertTrue(response.isProfileComplete());
    }

    @Test
    @DisplayName("Email Login: Should reject locked accounts")
    void testEmailLoginLockedAccount() {
        User user = new User(null, "locked@expensio.app", "Locked User");
        user.setId(UUID.randomUUID());
        user.setStatusEnum(AccountStatus.LOCKED);
        usersById.put(user.getId(), user);
        usersByEmail.put(user.getEmail(), user);

        Credential cred = new Credential(user.getId(), "hashed:P@ssword123");
        credentialsByUserId.put(user.getId(), cred);

        EmailLoginRequest request = new EmailLoginRequest("locked@expensio.app", "P@ssword123");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.loginEmail(request, "127.0.0.1", "device-1")
        );

        assertTrue(ex.getMessage().contains("locked"));
    }

    @Test
    @DisplayName("Email Login: Should lock account after 5 consecutive failed password attempts")
    void testEmailLoginBruteForceLockout() {
        User user = new User(null, "victim@expensio.app", "Victim User");
        user.setId(UUID.randomUUID());
        user.setStatusEnum(AccountStatus.ACTIVE);
        usersById.put(user.getId(), user);
        usersByEmail.put(user.getEmail(), user);

        Credential cred = new Credential(user.getId(), "hashed:RealP@ss1");
        credentialsByUserId.put(user.getId(), cred);

        EmailLoginRequest badRequest = new EmailLoginRequest("victim@expensio.app", "WrongPassword");

        // 4 failed attempts: returns standard invalid error
        for (int i = 1; i <= 4; i++) {
            UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                    authService.loginEmail(badRequest, "127.0.0.1", "device-1")
            );
            assertTrue(ex.getMessage().contains("Invalid email or password"));
            assertEquals(i, cred.getFailedAttempts());
            assertNull(cred.getLockoutExpiresAt());
        }

        // 5th failed attempt: triggers lockout
        UnauthorizedException lockoutEx = assertThrows(UnauthorizedException.class, () ->
                authService.loginEmail(badRequest, "127.0.0.1", "device-1")
        );
        assertTrue(lockoutEx.getMessage().contains("locked for 15 minutes"));
        assertEquals(5, cred.getFailedAttempts());
        assertNotNull(cred.getLockoutExpiresAt());

        // Subsequent attempt while locked: blocked immediately
        UnauthorizedException blockedEx = assertThrows(UnauthorizedException.class, () ->
                authService.loginEmail(badRequest, "127.0.0.1", "device-1")
        );
        assertTrue(blockedEx.getMessage().contains("temporarily locked"));
    }
}
