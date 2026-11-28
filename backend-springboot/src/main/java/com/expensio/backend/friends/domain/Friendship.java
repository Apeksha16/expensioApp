package com.expensio.backend.friends.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "friendships")
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "requester_id", nullable = false, updatable = false)
    private UUID requesterId;

    @Column(name = "addressee_id", nullable = false, updatable = false)
    private UUID addresseeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FriendshipStatus status = FriendshipStatus.PENDING;

    @Column(name = "pair_low", insertable = false, updatable = false)
    private UUID pairLow;

    @Column(name = "pair_high", insertable = false, updatable = false)
    private UUID pairHigh;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    public Friendship() {
    }

    public Friendship(UUID requesterId, UUID addresseeId, FriendshipStatus status) {
        this.requesterId = requesterId;
        this.addresseeId = addresseeId;
        this.status = status != null ? status : FriendshipStatus.PENDING;
    }

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = FriendshipStatus.PENDING;
        }
        if (this.status == FriendshipStatus.ACCEPTED && this.acceptedAt == null) {
            this.acceptedAt = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public UUID getAddresseeId() {
        return addresseeId;
    }

    public void setAddresseeId(UUID addresseeId) {
        this.addresseeId = addresseeId;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
    }

    public UUID getPairLow() {
        return pairLow;
    }

    public UUID getPairHigh() {
        return pairHigh;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
}
