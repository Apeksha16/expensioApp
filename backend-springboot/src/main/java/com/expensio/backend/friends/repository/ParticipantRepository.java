package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ParticipantRepository extends JpaRepository<Participant, UUID> {
}
