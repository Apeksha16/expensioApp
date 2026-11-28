package com.expensio.backend.onboarding.dto;

import com.expensio.backend.auth.dto.UserDto;
import com.expensio.backend.onboarding.UserEmployment;
import com.expensio.backend.onboarding.UserFinancialProfile;
import com.fasterxml.jackson.annotation.JsonProperty;

public class OnboardingStatusResponse {

    private String currentStep;
    private boolean isEmailVerified;
    private boolean isPhoneVerified;
    private boolean isProfileComplete;
    private boolean isEmploymentComplete;
    private boolean isFinancialProfileComplete;

    private UserDto profile;
    private UserEmployment employment;
    private UserFinancialProfile financialProfile;

    public OnboardingStatusResponse() {
    }

    public OnboardingStatusResponse(
            String currentStep,
            boolean isEmailVerified,
            boolean isPhoneVerified,
            boolean isProfileComplete,
            boolean isEmploymentComplete,
            boolean isFinancialProfileComplete) {
        this.currentStep = currentStep;
        this.isEmailVerified = isEmailVerified;
        this.isPhoneVerified = isPhoneVerified;
        this.isProfileComplete = isProfileComplete;
        this.isEmploymentComplete = isEmploymentComplete;
        this.isFinancialProfileComplete = isFinancialProfileComplete;
    }

    public OnboardingStatusResponse(
            String currentStep,
            boolean isEmailVerified,
            boolean isPhoneVerified,
            boolean isProfileComplete,
            boolean isEmploymentComplete,
            boolean isFinancialProfileComplete,
            UserDto profile,
            UserEmployment employment,
            UserFinancialProfile financialProfile) {
        this(currentStep, isEmailVerified, isPhoneVerified, isProfileComplete, isEmploymentComplete, isFinancialProfileComplete);
        this.profile = profile;
        this.employment = employment;
        this.financialProfile = financialProfile;
    }

    public String getCurrentStep() { return currentStep; }

    @JsonProperty("isEmailVerified")
    public boolean isEmailVerified() { return isEmailVerified; }

    @JsonProperty("isPhoneVerified")
    public boolean isPhoneVerified() { return isPhoneVerified; }

    @JsonProperty("isProfileComplete")
    public boolean isProfileComplete() { return isProfileComplete; }

    @JsonProperty("isEmploymentComplete")
    public boolean isEmploymentComplete() { return isEmploymentComplete; }

    @JsonProperty("isFinancialProfileComplete")
    public boolean isFinancialProfileComplete() { return isFinancialProfileComplete; }

    public UserDto getProfile() { return profile; }

    public UserEmployment getEmployment() { return employment; }

    public UserFinancialProfile getFinancialProfile() { return financialProfile; }
}


