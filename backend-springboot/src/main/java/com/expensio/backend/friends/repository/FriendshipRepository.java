package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.domain.Friendship;
import com.expensio.backend.friends.domain.FriendshipStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Friendship f WHERE f.id = :id")
    Optional<Friendship> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            SELECT COUNT(f)
            FROM Friendship f
            WHERE (f.requesterId = :userId OR f.addresseeId = :userId)
              AND f.status IN :statuses
            """)
    long countByParticipantAndStatusIn(
            @Param("userId") UUID userId,
            @Param("statuses") List<FriendshipStatus> statuses
    );

    @Query("""
            SELECT COUNT(f)
            FROM Friendship f
            JOIN Participant p ON p.id = CASE
                WHEN f.requesterId = :userId THEN f.addresseeId
                ELSE f.requesterId
            END
            WHERE (f.requesterId = :userId OR f.addresseeId = :userId)
              AND f.status IN :statuses
              AND p.kind = com.expensio.backend.friends.domain.ParticipantKind.USER
            """)
    long countUserRelationshipsByStatusIn(
            @Param("userId") UUID userId,
            @Param("statuses") List<FriendshipStatus> statuses
    );

    @Query("""
            SELECT f
            FROM Friendship f
            WHERE (f.requesterId = :userA AND f.addresseeId = :userB)
               OR (f.requesterId = :userB AND f.addresseeId = :userA)
            """)
    Optional<Friendship> findBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
