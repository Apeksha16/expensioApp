package com.expensio.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class MobileOtpVerifyRequest {

    @NotBlank(message = "Phone number is required")
    @JsonAlias({"phone", "phoneNumber"})
    private String phone;

    private String countryCode;

    @NotBlank(message = "OTP code is required")
    private String otp;

    private String challengeId;

    private String name;

    public MobileOtpVerifyRequest() {
    }

    public MobileOtpVerifyRequest(String phone, String otp, String challengeId, String name) {
        this.phone = phone;
        this.otp = otp;
        this.challengeId = challengeId;
        this.name = name;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}

