package com.expensio.backend.auth.dto;

public class OtpResponse {
    private String challengeId;
    private int expiresInSeconds;
    private int resendCooldownSeconds;
    private String message;

    public OtpResponse() {
    }

    public OtpResponse(String challengeId, int expiresInSeconds, int resendCooldownSeconds, String message) {
        this.challengeId = challengeId;
        this.expiresInSeconds = expiresInSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.message = message;
    }

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public int getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(int expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }
    public int getResendCooldownSeconds() { return resendCooldownSeconds; }
    public void setResendCooldownSeconds(int resendCooldownSeconds) { this.resendCooldownSeconds = resendCooldownSeconds; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

