package com.expensio.backend.verification.dto;

import jakarta.validation.constraints.NotBlank;

public class MobileVerificationVerifyRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String countryCode;

    @NotBlank(message = "OTP code is required")
    private String otp;

    private String challengeId;

    public MobileVerificationVerifyRequest() {
    }

    public MobileVerificationVerifyRequest(String phone, String otp, String challengeId) {
        this.phone = phone;
        this.otp = otp;
        this.challengeId = challengeId;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
}

