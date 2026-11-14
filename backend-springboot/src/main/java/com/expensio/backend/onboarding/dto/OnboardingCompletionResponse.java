package com.expensio.backend.onboarding.dto;

import com.expensio.backend.auth.dto.UserDto;

public class OnboardingCompletionResponse {

    private String username;
    private UserDto user;
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String message;

    public OnboardingCompletionResponse() {
    }

    public OnboardingCompletionResponse(String username, UserDto user, String accessToken, String refreshToken, String tokenType, String message) {
        this.username = username;
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.message = message;
    }

    public String getUsername() { return username; }
    public UserDto getUser() { return user; }
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getTokenType() { return tokenType; }
    public String getMessage() { return message; }
}

