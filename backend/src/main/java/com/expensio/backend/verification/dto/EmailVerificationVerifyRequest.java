package com.expensio.backend.verification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class EmailVerificationVerifyRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "OTP code is required")
    private String otp;

    private String challengeId;

    public EmailVerificationVerifyRequest() {
    }

    public EmailVerificationVerifyRequest(String email, String otp, String challengeId) {
        this.email = email;
        this.otp = otp;
        this.challengeId = challengeId;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
}

