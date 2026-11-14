package com.expensio.backend.user.service;

import com.expensio.backend.audit.AuditLog;
import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.exception.ConflictException;
import com.expensio.backend.onboarding.UserEmploymentRepository;
import com.expensio.backend.onboarding.UserFinancialProfileRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.expensio.backend.user.dto.UserProfileDetailResponse;
import com.expensio.backend.username.UsernameGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserServiceTest {

    private final Map<UUID, User> userDb = new HashMap<>();
    private final Map<UUID, UserProfile> profileDb = new HashMap<>();
    private final List<AuditLog> auditDb = new ArrayList<>();

    private UserService userService;
    private UsernameGeneratorService usernameGeneratorService;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        userDb.clear();
        profileDb.clear();
        auditDb.clear();

        testUserId = UUID.randomUUID();
        User user = new User(null, "ishita@expensio.app", "Ishita K");
        user.setId(testUserId);
        user.setStatusEnum(AccountStatus.ACTIVE);
        userDb.put(testUserId, user);

        UserProfile profile = new UserProfile(testUserId);
        profile.setUsername("ishita");
        profile.setProfileComplete(true);
        profileDb.put(testUserId, profile);

        UserRepository userRepo = (UserRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findById".equals(name)) {
                        return Optional.ofNullable(userDb.get((UUID) args[0]));
                    } else if ("save".equals(name)) {
                        User u = (User) args[0];
                        userDb.put(u.getId(), u);
                        return u;
                    }
                    return null;
                }
        );

        UserProfileRepository profileRepo = (UserProfileRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findById".equals(name)) {
                        return Optional.ofNullable(profileDb.get((UUID) args[0]));
                    } else if ("save".equals(name)) {
                        UserProfile p = (UserProfile) args[0];
                        profileDb.put(p.getUserId(), p);
                        return p;
                    } else if ("existsByUsernameIgnoreCase".equals(name)) {
                        String target = ((String) args[0]).toLowerCase();
                        return profileDb.values().stream()
                                .anyMatch(p -> p.getUsername() != null && p.getUsername().equalsIgnoreCase(target));
                    }
                    return null;
                }
        );

        UserEmploymentRepository employmentRepo = (UserEmploymentRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{UserEmploymentRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        UserFinancialProfileRepository financialRepo = (UserFinancialProfileRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{UserFinancialProfileRepository.class},
                (proxy, method, args) -> Optional.empty()
        );

        AuditLogRepository auditRepo = (AuditLogRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{AuditLogRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        auditDb.add((AuditLog) args[0]);
                        return args[0];
                    }
                    return null;
                }
        );

        usernameGeneratorService = new UsernameGeneratorService(profileRepo);
        userService = new UserService(userRepo, profileRepo, employmentRepo, financialRepo, auditRepo, usernameGeneratorService);
    }

    @Test
    @DisplayName("Should successfully change username and record audit log")
    void testUpdateUsernameSuccess() {
        UserProfileDetailResponse response = userService.updateUsername(testUserId, "ishita_new", "127.0.0.1");

        assertThat(response.getUsername()).isEqualTo("ishita_new");
        assertThat(profileDb.get(testUserId).getUsername()).isEqualTo("ishita_new");
        assertThat(auditDb).hasSize(1);
        assertThat(auditDb.get(0).getAction()).isEqualTo("USERNAME_CHANGED");
    }

    @Test
    @DisplayName("Should reject reserved username")
    void testUpdateUsernameReserved() {
        assertThatThrownBy(() -> userService.updateUsername(testUserId, "admin", "127.0.0.1"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("unavailable or reserved");
    }

    @Test
    @DisplayName("Should reject username that is already taken by another user")
    void testUpdateUsernameDuplicate() {
        UUID otherId = UUID.randomUUID();
        UserProfile otherProfile = new UserProfile(otherId);
        otherProfile.setUsername("takenuser");
        profileDb.put(otherId, otherProfile);

        assertThatThrownBy(() -> userService.updateUsername(testUserId, "takenuser", "127.0.0.1"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("unavailable or reserved");
    }

    @Test
    @DisplayName("Should reject username with invalid length")
    void testUpdateUsernameInvalidLength() {
        assertThatThrownBy(() -> userService.updateUsername(testUserId, "ab", "127.0.0.1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("between 3 and 30");
    }
}
