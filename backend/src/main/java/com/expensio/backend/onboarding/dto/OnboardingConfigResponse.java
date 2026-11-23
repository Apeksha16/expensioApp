package com.expensio.backend.onboarding.dto;

import java.util.List;

public class OnboardingConfigResponse {

    private List<EmploymentTypeConfig> employmentTypes;
    private boolean savingsEligible;
    private List<String> supportedCurrencies;
    private String defaultCurrency;
    private long minAmountMinor;
    private long maxAmountMinor;

    public OnboardingConfigResponse() {
    }

    public OnboardingConfigResponse(
            List<EmploymentTypeConfig> employmentTypes,
            boolean savingsEligible,
            List<String> supportedCurrencies,
            String defaultCurrency,
            long minAmountMinor,
            long maxAmountMinor) {
        this.employmentTypes = employmentTypes;
        this.savingsEligible = savingsEligible;
        this.supportedCurrencies = supportedCurrencies;
        this.defaultCurrency = defaultCurrency;
        this.minAmountMinor = minAmountMinor;
        this.maxAmountMinor = maxAmountMinor;
    }

    public static class EmploymentTypeConfig {
        private String type;
        private String fieldLabel;
        private String fieldName;
        private boolean required;

        public EmploymentTypeConfig() {}

        public EmploymentTypeConfig(String type, String fieldLabel, String fieldName, boolean required) {
            this.type = type;
            this.fieldLabel = fieldLabel;
            this.fieldName = fieldName;
            this.required = required;
        }

        public String getType() { return type; }
        public String getFieldLabel() { return fieldLabel; }
        public String getFieldName() { return fieldName; }
        public boolean isRequired() { return required; }
    }

    public List<EmploymentTypeConfig> getEmploymentTypes() { return employmentTypes; }
    public boolean isSavingsEligible() { return savingsEligible; }
    public List<String> getSupportedCurrencies() { return supportedCurrencies; }
    public String getDefaultCurrency() { return defaultCurrency; }
    public long getMinAmountMinor() { return minAmountMinor; }
    public long getMaxAmountMinor() { return maxAmountMinor; }
}

