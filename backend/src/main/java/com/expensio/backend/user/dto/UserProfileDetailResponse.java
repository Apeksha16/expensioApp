package com.expensio.backend.user.dto;

import com.expensio.backend.onboarding.UserEmployment;
import com.expensio.backend.onboarding.UserFinancialProfile;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public class UserProfileDetailResponse {

    private UUID id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private String status;
    private boolean isProfileComplete;
    private UserEmployment employment;
    private UserFinancialProfile financialProfile;
    private Instant createdAt;

    public UserProfileDetailResponse() {
    }

    public UserProfileDetailResponse(
            UUID id,
            String username,
            String name,
            String email,
            String phone,
            String status,
            boolean isProfileComplete,
            UserEmployment employment,
            UserFinancialProfile financialProfile,
            Instant createdAt) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.isProfileComplete = isProfileComplete;
        this.employment = employment;
        this.financialProfile = financialProfile;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getStatus() { return status; }

    @JsonProperty("isProfileComplete")
    public boolean isProfileComplete() { return isProfileComplete; }

    public UserEmployment getEmployment() { return employment; }
    public UserFinancialProfile getFinancialProfile() { return financialProfile; }
    public Instant getCreatedAt() { return createdAt; }
}

