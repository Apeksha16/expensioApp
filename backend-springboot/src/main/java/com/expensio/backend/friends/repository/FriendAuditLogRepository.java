package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.domain.FriendAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FriendAuditLogRepository extends JpaRepository<FriendAuditLog, UUID> {

    List<FriendAuditLog> findByActorUserIdOrderByCreatedAtDesc(UUID actorUserId);

    List<FriendAuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);
}
