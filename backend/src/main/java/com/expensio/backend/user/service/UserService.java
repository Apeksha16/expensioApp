package com.expensio.backend.user.service;

import com.expensio.backend.audit.AuditLog;
import com.expensio.backend.audit.AuditLogRepository;
import com.expensio.backend.exception.BadRequestException;
import com.expensio.backend.exception.ConflictException;
import com.expensio.backend.exception.ResourceNotFoundException;
import com.expensio.backend.onboarding.UserEmployment;
import com.expensio.backend.onboarding.UserEmploymentRepository;
import com.expensio.backend.onboarding.UserFinancialProfile;
import com.expensio.backend.onboarding.UserFinancialProfileRepository;
import com.expensio.backend.onboarding.dto.UpdateProfileRequest;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.expensio.backend.user.dto.UserProfileDetailResponse;
import com.expensio.backend.username.UsernameGeneratorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserEmploymentRepository userEmploymentRepository;
    private final UserFinancialProfileRepository userFinancialProfileRepository;
    private final AuditLogRepository auditLogRepository;
    private final UsernameGeneratorService usernameGeneratorService;

    public UserService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserEmploymentRepository userEmploymentRepository,
            UserFinancialProfileRepository userFinancialProfileRepository,
            AuditLogRepository auditLogRepository,
            UsernameGeneratorService usernameGeneratorService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userEmploymentRepository = userEmploymentRepository;
        this.userFinancialProfileRepository = userFinancialProfileRepository;
        this.auditLogRepository = auditLogRepository;
        this.usernameGeneratorService = usernameGeneratorService;
    }

    public UserProfileDetailResponse getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        UserEmployment employment = userEmploymentRepository.findById(userId).orElse(null);
        UserFinancialProfile financialProfile = userFinancialProfileRepository.findById(userId).orElse(null);

        String username = profile != null ? profile.getUsername() : null;
        boolean isProfileComplete = profile != null && profile.isProfileComplete();

        return new UserProfileDetailResponse(
                user.getId(),
                username,
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus(),
                isProfileComplete,
                employment,
                financialProfile,
                user.getCreatedAt()
        );
    }

    @Transactional
    public UserProfileDetailResponse updateMe(UUID userId, UpdateProfileRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            String fullName = request.getFirstName().trim();
            if (request.getLastName() != null && !request.getLastName().isBlank()) {
                fullName += " " + request.getLastName().trim();
            }
            user.setName(fullName);
            user = userRepository.save(user);
        }

        AuditLog logEntry = new AuditLog(userId, "USER_PROFILE_UPDATED", "users", userId.toString(), ipAddress, "Profile updated via user settings");
        auditLogRepository.save(logEntry);

        return getMe(userId);
    }

    @Transactional
    public UserProfileDetailResponse updateUsername(UUID userId, String newUsername, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user: " + userId));

        String normalized = usernameGeneratorService.normalize(newUsername);
        if (normalized.length() < 3 || normalized.length() > 30) {
            throw new BadRequestException("Username must be between 3 and 30 alphanumeric characters");
        }

        if (normalized.equalsIgnoreCase(profile.getUsername())) {
            return getMe(userId);
        }

        if (!usernameGeneratorService.isAvailable(normalized)) {
            throw new ConflictException("Username '" + normalized + "' is unavailable or reserved");
        }

        String previousUsername = profile.getUsername();
        profile.setUsername(normalized);
        userProfileRepository.save(profile);

        AuditLog logEntry = new AuditLog(
                userId,
                "USERNAME_CHANGED",
                "user_profiles",
                userId.toString(),
                ipAddress,
                "Username changed from '" + previousUsername + "' to '" + normalized + "'"
        );
        auditLogRepository.save(logEntry);

        return getMe(userId);
    }
}
