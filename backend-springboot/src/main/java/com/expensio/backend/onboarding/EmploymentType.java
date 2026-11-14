package com.expensio.backend.onboarding;

public enum EmploymentType {
    SALARIED("Monthly Salary", "monthlySalary"),
    BUSINESS("Monthly Minimum Income", "monthlyIncome"),
    STUDENT("Monthly Pocket Money", "pocketMoney"),
    RETIRED("Monthly Pension", "pension"),
    HOMEMAKER("Monthly Household Budget", "householdBudget");

    private final String fieldLabel;
    private final String fieldName;

    EmploymentType(String fieldLabel, String fieldName) {
        this.fieldLabel = fieldLabel;
        this.fieldName = fieldName;
    }

    public String getFieldLabel() {
        return fieldLabel;
    }

    public String getFieldName() {
        return fieldName;
    }
}

