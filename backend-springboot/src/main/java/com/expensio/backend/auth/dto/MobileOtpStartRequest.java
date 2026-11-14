package com.expensio.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class MobileOtpStartRequest {

    @NotBlank(message = "Phone number is required")
    @JsonAlias({"phone", "phoneNumber"})
    private String phone;

    private String countryCode;

    public MobileOtpStartRequest() {
    }

    public MobileOtpStartRequest(String phone, String countryCode) {
        this.phone = phone;
        this.countryCode = countryCode;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
}

