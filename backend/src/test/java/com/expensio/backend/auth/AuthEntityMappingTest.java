package com.expensio.backend.auth;

import com.expensio.backend.profile.UserProfile;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AuthEntityMappingTest {

    @Test
    void userProfile_CompleteFlow() {
        UUID userId = UUID.randomUUID();
        UserProfile profile = new UserProfile(userId);
        profile.setUsername("@apeksha");
        profile.setAvatarId("avatar_1");
        profile.setMonthlySalary(new BigDecimal("50000.00"));
        profile.setMonthlyBudget(new BigDecimal("30000.00"));
        profile.setProfileComplete(true);
        profile.onCreate();

        assertThat(profile.getUserId()).isEqualTo(userId);
        assertThat(profile.getUsername()).isEqualTo("@apeksha");
        assertThat(profile.getAvatarId()).isEqualTo("avatar_1");
        assertThat(profile.getMonthlySalary()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(profile.getMonthlyBudget()).isEqualByComparingTo(new BigDecimal("30000.00"));
        assertThat(profile.isProfileComplete()).isTrue();
        assertThat(profile.getCreatedAt()).isNotNull();
    }

    @Test
    void userMpin_HashedPinAndFailedAttempts() {
        UUID userId = UUID.randomUUID();
        String hash = "$2a$12$e8rO2ZtG4Y1aBCxyzMockHashedMpinString";
        UserMpin mpin = new UserMpin(userId, hash);
        mpin.onCreate();

        assertThat(mpin.getUserId()).isEqualTo(userId);
        assertThat(mpin.getMpinHash()).isEqualTo(hash);
        assertThat(mpin.getFailedAttempts()).isZero();
        assertThat(mpin.getLockedUntil()).isNull();

        mpin.setFailedAttempts(mpin.getFailedAttempts() + 1);
        Instant lock = Instant.now().plus(15, ChronoUnit.MINUTES);
        mpin.setLockedUntil(lock);

        assertThat(mpin.getFailedAttempts()).isEqualTo(1);
        assertThat(mpin.getLockedUntil()).isEqualTo(lock);
    }

    @Test
    void authIdentity_ProviderSubjectIntegrity() {
        UUID userId = UUID.randomUUID();
        AuthIdentity identity = new AuthIdentity(userId, "GOOGLE", "google-sub-123456789", "apeksha@expensio.app");
        identity.onCreate();

        assertThat(identity.getUserId()).isEqualTo(userId);
        assertThat(identity.getProvider()).isEqualTo("GOOGLE");
        assertThat(identity.getProviderSubject()).isEqualTo("google-sub-123456789");
        assertThat(identity.getProviderEmail()).isEqualTo("apeksha@expensio.app");
        assertThat(identity.getCreatedAt()).isNotNull();
    }

    @Test
    void otpVerification_Lifecycle() {
        Instant expiry = Instant.now().plus(5, ChronoUnit.MINUTES);
        OtpVerification otp = new OtpVerification("PHONE", "+919876543210", "sha256_hashed_otp", "LOGIN", expiry);
        otp.onCreate();

        assertThat(otp.getTargetType()).isEqualTo("PHONE");
        assertThat(otp.getTargetIdentifier()).isEqualTo("+919876543210");
        assertThat(otp.getOtpHash()).isEqualTo("sha256_hashed_otp");
        assertThat(otp.getPurpose()).isEqualTo("LOGIN");
        assertThat(otp.getAttempts()).isZero();
        assertThat(otp.getMaxAttempts()).isEqualTo(5);
        assertThat(otp.getExpiresAt()).isEqualTo(expiry);
        assertThat(otp.getConsumedAt()).isNull();

        Instant consumed = Instant.now();
        otp.setConsumedAt(consumed);
        assertThat(otp.getConsumedAt()).isEqualTo(consumed);
    }

    @Test
    void temporaryAuthToken_Verification() {
        UUID userId = UUID.randomUUID();
        Instant expiry = Instant.now().plus(15, ChronoUnit.MINUTES);
        TemporaryAuthToken token = new TemporaryAuthToken(userId, "hashed_capability_token", "apeksha@expensio.app", "RECOVERY", expiry);
        token.onCreate();

        assertThat(token.getUserId()).isEqualTo(userId);
        assertThat(token.getTokenHash()).isEqualTo("hashed_capability_token");
        assertThat(token.getIdentifier()).isEqualTo("apeksha@expensio.app");
        assertThat(token.getTokenType()).isEqualTo("RECOVERY");
        assertThat(token.getExpiresAt()).isEqualTo(expiry);
        assertThat(token.getConsumedAt()).isNull();
    }

    @Test
    void refreshToken_SessionAndRevocation() {
        UUID userId = UUID.randomUUID();
        Instant expiry = Instant.now().plus(30, ChronoUnit.DAYS);
        RefreshToken session = new RefreshToken(userId, "hashed_refresh_token_xyz", expiry);
        session.setDeviceInfo("iPhone 15 Pro, iOS 18");
        session.setIpAddress("192.168.1.100");
        session.onCreate();

        assertThat(session.getUserId()).isEqualTo(userId);
        assertThat(session.getTokenHash()).isEqualTo("hashed_refresh_token_xyz");
        assertThat(session.getDeviceInfo()).isEqualTo("iPhone 15 Pro, iOS 18");
        assertThat(session.getIpAddress()).isEqualTo("192.168.1.100");
        assertThat(session.isRevoked()).isFalse();
        assertThat(session.getRevokedAt()).isNull();

        session.setRevoked(true);
        Instant now = Instant.now();
        session.setRevokedAt(now);
        session.setReplacedByTokenHash("hashed_refresh_token_rotated");

        assertThat(session.isRevoked()).isTrue();
        assertThat(session.getRevokedAt()).isEqualTo(now);
        assertThat(session.getReplacedByTokenHash()).isEqualTo("hashed_refresh_token_rotated");
    }
}
