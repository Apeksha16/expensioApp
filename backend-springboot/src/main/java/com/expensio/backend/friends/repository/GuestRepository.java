package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.domain.GuestProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuestRepository extends JpaRepository<GuestProfile, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GuestProfile g WHERE g.id = :id")
    Optional<GuestProfile> findByIdForUpdate(@Param("id") UUID id);

    long countByOwnerUserIdAndRetiredAtIsNull(UUID ownerUserId);

    List<GuestProfile> findByOwnerUserIdAndRetiredAtIsNullOrderByCreatedAtAscIdAsc(UUID ownerUserId);

    Optional<GuestProfile> findByIdAndOwnerUserId(UUID id, UUID ownerUserId);

    @Query("""
            SELECT COUNT(g) > 0
            FROM GuestProfile g
            WHERE g.ownerUserId = :ownerUserId
              AND LOWER(g.username) = LOWER(:username)
            """)
    boolean existsByOwnerUserIdAndNormalizedUsername(
            @Param("ownerUserId") UUID ownerUserId,
            @Param("username") String username
    );
}
