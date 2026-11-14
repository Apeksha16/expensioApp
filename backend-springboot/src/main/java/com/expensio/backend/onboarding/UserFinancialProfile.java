package com.expensio.backend.onboarding;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_financial_profiles")
public class UserFinancialProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "cash_balance_minor", nullable = false)
    private Long cashBalanceMinor = 0L;

    @Column(name = "savings_balance_minor", nullable = false)
    private Long savingsBalanceMinor = 0L;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserFinancialProfile() {
    }

    public UserFinancialProfile(UUID userId, Long cashBalanceMinor, Long savingsBalanceMinor, String currency) {
        this.userId = userId;
        this.cashBalanceMinor = cashBalanceMinor != null ? cashBalanceMinor : 0L;
        this.savingsBalanceMinor = savingsBalanceMinor != null ? savingsBalanceMinor : 0L;
        this.currency = (currency != null && !currency.isBlank()) ? currency.toUpperCase() : "INR";
    }

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "INR";
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Long getCashBalanceMinor() {
        return cashBalanceMinor;
    }

    public void setCashBalanceMinor(Long cashBalanceMinor) {
        this.cashBalanceMinor = cashBalanceMinor;
    }

    public Long getSavingsBalanceMinor() {
        return savingsBalanceMinor;
    }

    public void setSavingsBalanceMinor(Long savingsBalanceMinor) {
        this.savingsBalanceMinor = savingsBalanceMinor;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

