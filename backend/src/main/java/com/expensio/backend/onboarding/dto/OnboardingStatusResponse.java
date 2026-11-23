package com.expensio.backend.onboarding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OnboardingStatusResponse {

    private String currentStep;
    private boolean isEmailVerified;
    private boolean isPhoneVerified;
    private boolean isProfileComplete;
    private boolean isEmploymentComplete;
    private boolean isFinancialProfileComplete;

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
}

