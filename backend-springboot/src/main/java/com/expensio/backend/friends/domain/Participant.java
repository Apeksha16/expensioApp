package com.expensio.backend.friends.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "participants")
public class Participant {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 16, updatable = false)
    private ParticipantKind kind;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Participant() {
    }

    public Participant(UUID id, ParticipantKind kind) {
        this.id = id;
        this.kind = kind;
    }

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ParticipantKind getKind() {
        return kind;
    }

    public void setKind(ParticipantKind kind) {
        this.kind = kind;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
