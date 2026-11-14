package com.expensio.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType; // "APPLICATION" or "ONBOARDING"
    private long expiresInMs;
    private UserDto user;
    private String onboardingStatus;

    @JsonProperty("isProfileComplete")
    private boolean isProfileComplete;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresInMs, UserDto user, String onboardingStatus, boolean isProfileComplete, String message) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.expiresInMs = expiresInMs;
        this.user = user;
        this.onboardingStatus = onboardingStatus;
        this.isProfileComplete = isProfileComplete;
        this.message = message;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresInMs() { return expiresInMs; }
    public void setExpiresInMs(long expiresInMs) { this.expiresInMs = expiresInMs; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
    public String getOnboardingStatus() { return onboardingStatus; }
    public void setOnboardingStatus(String onboardingStatus) { this.onboardingStatus = onboardingStatus; }
    public boolean isProfileComplete() { return isProfileComplete; }
    public void setProfileComplete(boolean profileComplete) { isProfileComplete = profileComplete; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
