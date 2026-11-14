package com.expensio.backend.onboarding;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_employment")
public class UserEmployment {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 30)
    private EmploymentType employmentType;

    @Column(name = "monthly_income_minor", nullable = false)
    private Long monthlyIncomeMinor;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserEmployment() {
    }

    public UserEmployment(UUID userId, EmploymentType employmentType, Long monthlyIncomeMinor, String currency) {
        this.userId = userId;
        this.employmentType = employmentType;
        this.monthlyIncomeMinor = monthlyIncomeMinor;
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

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public Long getMonthlyIncomeMinor() {
        return monthlyIncomeMinor;
    }

    public void setMonthlyIncomeMinor(Long monthlyIncomeMinor) {
        this.monthlyIncomeMinor = monthlyIncomeMinor;
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

