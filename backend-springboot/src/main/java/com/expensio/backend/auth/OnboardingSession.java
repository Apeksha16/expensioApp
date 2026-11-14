package com.expensio.backend.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_sessions")
public class OnboardingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "session_token_hash", nullable = false, unique = true, length = 255)
    private String sessionTokenHash;

    @Column(name = "current_step", nullable = false, length = 50)
    private String currentStep = "PROFILE";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public OnboardingSession() {
    }

    public OnboardingSession(UUID userId, String sessionTokenHash, String currentStep, Instant expiresAt) {
        this.userId = userId;
        this.sessionTokenHash = sessionTokenHash;
        this.currentStep = currentStep != null ? currentStep : "PROFILE";
        this.expiresAt = expiresAt;
        this.isActive = true;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.currentStep == null) {
            this.currentStep = "PROFILE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getSessionTokenHash() {
        return sessionTokenHash;
    }

    public void setSessionTokenHash(String sessionTokenHash) {
        this.sessionTokenHash = sessionTokenHash;
    }

    public String getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(String currentStep) {
        this.currentStep = currentStep;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

