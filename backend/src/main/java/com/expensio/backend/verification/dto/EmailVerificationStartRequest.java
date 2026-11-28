package com.expensio.backend.verification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class EmailVerificationStartRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    public EmailVerificationStartRequest() {
    }

    public EmailVerificationStartRequest(String email) {
        this.email = email;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

