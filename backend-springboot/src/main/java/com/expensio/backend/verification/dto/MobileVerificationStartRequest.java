package com.expensio.backend.verification.dto;

import jakarta.validation.constraints.NotBlank;

public class MobileVerificationStartRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String countryCode;

    public MobileVerificationStartRequest() {
    }

    public MobileVerificationStartRequest(String phone, String countryCode) {
        this.phone = phone;
        this.countryCode = countryCode;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
}

