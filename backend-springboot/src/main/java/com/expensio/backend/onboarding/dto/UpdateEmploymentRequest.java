package com.expensio.backend.onboarding.dto;

import com.expensio.backend.onboarding.EmploymentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateEmploymentRequest {

    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;

    @NotNull(message = "Financial amount in minor units is required")
    @Min(value = 0, message = "Financial amount cannot be negative")
    private Long monthlyIncomeMinor;

    private String currency = "INR";

    public UpdateEmploymentRequest() {
    }

    public UpdateEmploymentRequest(EmploymentType employmentType, Long monthlyIncomeMinor, String currency) {
        this.employmentType = employmentType;
        this.monthlyIncomeMinor = monthlyIncomeMinor;
        this.currency = currency != null ? currency : "INR";
    }

    public EmploymentType getEmploymentType() { return employmentType; }
    public void setEmploymentType(EmploymentType employmentType) { this.employmentType = employmentType; }
    public Long getMonthlyIncomeMinor() { return monthlyIncomeMinor; }
    public void setMonthlyIncomeMinor(Long monthlyIncomeMinor) { this.monthlyIncomeMinor = monthlyIncomeMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

