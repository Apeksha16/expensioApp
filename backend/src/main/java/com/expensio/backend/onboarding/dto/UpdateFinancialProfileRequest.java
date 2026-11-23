package com.expensio.backend.onboarding.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateFinancialProfileRequest {

    @NotNull(message = "Cash balance is required")
    @Min(value = 0, message = "Cash balance cannot be negative")
    private Long cashBalanceMinor;

    @NotNull(message = "Savings balance is required")
    @Min(value = 0, message = "Savings balance cannot be negative")
    private Long savingsBalanceMinor;

    private String currency = "INR";

    public UpdateFinancialProfileRequest() {
    }

    public UpdateFinancialProfileRequest(Long cashBalanceMinor, Long savingsBalanceMinor, String currency) {
        this.cashBalanceMinor = cashBalanceMinor;
        this.savingsBalanceMinor = savingsBalanceMinor;
        this.currency = currency != null ? currency : "INR";
    }

    public Long getCashBalanceMinor() { return cashBalanceMinor; }
    public void setCashBalanceMinor(Long cashBalanceMinor) { this.cashBalanceMinor = cashBalanceMinor; }
    public Long getSavingsBalanceMinor() { return savingsBalanceMinor; }
    public void setSavingsBalanceMinor(Long savingsBalanceMinor) { this.savingsBalanceMinor = savingsBalanceMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

