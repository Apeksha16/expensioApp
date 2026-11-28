package com.expensio.backend.friends.service;

import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.domain.*;
import com.expensio.backend.friends.dto.FriendshipDirection;
import com.expensio.backend.friends.dto.FriendshipResponseDto;
import com.expensio.backend.friends.dto.ParticipantSummaryDto;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import com.expensio.backend.friends.policy.ObligationDecision;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.repository.FriendAuditLogRepository;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.AccountStatus;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FriendsCommandService {

    private static final List<FriendshipStatus> CAP_STATUSES =
            List.of(FriendshipStatus.PENDING, FriendshipStatus.ACCEPTED);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ParticipantRepository participantRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendAuditLogRepository auditLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final SplitObligationPolicy splitObligationPolicy;
    private final FriendsProperties properties;
    private final ObjectMapper objectMapper;
    private final FriendsRateLimiter rateLimiter;

    public FriendsCommandService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            ParticipantRepository participantRepository,
            FriendshipRepository friendshipRepository,
            FriendAuditLogRepository auditLogRepository,
            OutboxEventRepository outboxEventRepository,
            SplitObligationPolicy splitObligationPolicy,
            FriendsProperties properties,
            ObjectMapper objectMapper) {
        this(userRepository, userProfileRepository, participantRepository, friendshipRepository,
                auditLogRepository, outboxEventRepository, splitObligationPolicy, properties,
                objectMapper, new FriendsRateLimiter());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public FriendsCommandService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            ParticipantRepository participantRepository,
            FriendshipRepository friendshipRepository,
            FriendAuditLogRepository auditLogRepository,
            OutboxEventRepository outboxEventRepository,
            SplitObligationPolicy splitObligationPolicy,
            FriendsProperties properties,
            ObjectMapper objectMapper,
            FriendsRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.participantRepository = participantRepository;
        this.friendshipRepository = friendshipRepository;
        this.auditLogRepository = auditLogRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.splitObligationPolicy = splitObligationPolicy;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public FriendshipResponseDto sendRequest(UUID requesterId, UUID addresseeId) {
        rateLimiter.checkAndConsume(
                "friend_request",
                requesterId.toString(),
                properties.getRateLimit().getFriendRequestsPerMinute(),
                60
        );
        if (requesterId.equals(addresseeId)) {
            throw new FriendApiException(FriendErrorCode.SELF_FRIEND_REQUEST);
        }

        participantRepository.findById(addresseeId).ifPresent(participant -> {
            if (participant.getKind() == ParticipantKind.GUEST) {
                throw new FriendApiException(FriendErrorCode.GUEST_CANNOT_BE_REQUESTED);
            }
        });

        // Deterministic UUID ordering avoids deadlocks when locking both user rows
        UUID firstId = requesterId.compareTo(addresseeId) <= 0 ? requesterId : addresseeId;
        UUID secondId = requesterId.compareTo(addresseeId) <= 0 ? addresseeId : requesterId;

        User firstUser = userRepository.findByIdForUpdate(firstId)
                .orElseThrow(() -> new FriendApiException(
                        firstId.equals(addresseeId) ? FriendErrorCode.USER_NOT_FOUND : FriendErrorCode.UNAUTHORIZED));
        User secondUser = userRepository.findByIdForUpdate(secondId)
                .orElseThrow(() -> new FriendApiException(
                        secondId.equals(addresseeId) ? FriendErrorCode.USER_NOT_FOUND : FriendErrorCode.UNAUTHORIZED));

        User addresseeUser = firstUser.getId().equals(addresseeId) ? firstUser : secondUser;
        if (addresseeUser.getStatusEnum() != AccountStatus.ACTIVE) {
            throw new FriendApiException(FriendErrorCode.USER_NOT_FOUND);
        }

        if (friendshipRepository.findBetween(requesterId, addresseeId).isPresent()) {
            throw new FriendApiException(FriendErrorCode.RELATIONSHIP_EXISTS);
        }

        long requesterCount = countRelationshipsForCap(requesterId);
        if (requesterCount >= properties.getFriendCap()) {
            throw new FriendApiException(FriendErrorCode.FRIEND_LIMIT_REACHED);
        }

        long addresseeCount = countRelationshipsForCap(addresseeId);
        if (addresseeCount >= properties.getFriendCap()) {
            throw new FriendApiException(FriendErrorCode.TARGET_FRIEND_LIMIT_REACHED);
        }

        Friendship saved;
        try {
            saved = friendshipRepository.saveAndFlush(
                    new Friendship(requesterId, addresseeId, FriendshipStatus.PENDING));
        } catch (DataIntegrityViolationException ex) {
            throw new FriendApiException(FriendErrorCode.RELATIONSHIP_EXISTS);
        }

        writeFriendshipOutbox("FRIEND_REQUEST_RECEIVED", saved.getId(), List.of(addresseeId));
        writeAuditLog(requesterId, "FRIEND_REQUEST_SENT", "FRIENDSHIP", saved.getId(),
                "requesterId=" + requesterId + ",addresseeId=" + addresseeId);

        ParticipantSummaryDto addresseeSummary = buildUserSummary(addresseeUser);
        return new FriendshipResponseDto(
                saved.getId(),
                saved.getStatus(),
                FriendshipDirection.OUTGOING,
                saved.getCreatedAt(),
                saved.getAcceptedAt(),
                addresseeSummary
        );
    }

    @Transactional
    public FriendshipResponseDto acceptRequest(UUID callerId, UUID friendshipId) {
        Friendship friendship = friendshipRepository.findByIdForUpdate(friendshipId)
                .orElseThrow(() -> resolveMissingFriendshipOnAccept(callerId, friendshipId));

        if (!friendship.getRequesterId().equals(callerId) && !friendship.getAddresseeId().equals(callerId)) {
            throw new FriendApiException(FriendErrorCode.FRIENDSHIP_NOT_FOUND);
        }

        if (!friendship.getAddresseeId().equals(callerId)) {
            throw new FriendApiException(FriendErrorCode.FORBIDDEN, "Only the addressee can accept this friend request");
        }

        if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
            User requesterUser = userRepository.findById(friendship.getRequesterId())
                    .orElseThrow(() -> new FriendApiException(FriendErrorCode.FRIENDSHIP_NOT_FOUND));
            return new FriendshipResponseDto(
                    friendship.getId(),
                    friendship.getStatus(),
                    FriendshipDirection.NONE,
                    friendship.getCreatedAt(),
                    friendship.getAcceptedAt(),
                    buildUserSummary(requesterUser)
            );
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new FriendApiException(FriendErrorCode.REQUEST_NOT_PENDING);
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setAcceptedAt(Instant.now());
        Friendship saved = friendshipRepository.saveAndFlush(friendship);

        writeFriendshipOutbox("FRIEND_REQUEST_ACCEPTED", saved.getId(), List.of(saved.getRequesterId()));
        writeAuditLog(callerId, "FRIEND_REQUEST_ACCEPTED", "FRIENDSHIP", saved.getId(),
                "requesterId=" + saved.getRequesterId() + ",addresseeId=" + saved.getAddresseeId());

        User requesterUser = userRepository.findById(saved.getRequesterId())
                .orElseThrow(() -> new FriendApiException(FriendErrorCode.USER_NOT_FOUND));

        return new FriendshipResponseDto(
                saved.getId(),
                saved.getStatus(),
                FriendshipDirection.NONE,
                saved.getCreatedAt(),
                saved.getAcceptedAt(),
                buildUserSummary(requesterUser)
        );
    }

    @Transactional
    public void deleteFriendship(UUID callerId, UUID friendshipId) {
        Friendship friendship = friendshipRepository.findByIdForUpdate(friendshipId)
                .orElseThrow(() -> new FriendApiException(FriendErrorCode.FRIENDSHIP_NOT_FOUND));

        UUID requesterId = friendship.getRequesterId();
        UUID addresseeId = friendship.getAddresseeId();

        if (!requesterId.equals(callerId) && !addresseeId.equals(callerId)) {
            throw new FriendApiException(FriendErrorCode.FRIENDSHIP_NOT_FOUND);
        }

        if (friendship.getStatus() == FriendshipStatus.PENDING) {
            String eventType;
            String auditAction;
            UUID recipientId;
            if (requesterId.equals(callerId)) {
                eventType = "FRIEND_REQUEST_CANCELLED";
                auditAction = "FRIEND_REQUEST_CANCELLED";
                recipientId = addresseeId;
            } else {
                eventType = "FRIEND_REQUEST_DECLINED";
                auditAction = "FRIEND_REQUEST_DECLINED";
                recipientId = requesterId;
            }

            friendshipRepository.delete(friendship);
            friendshipRepository.flush();

            writeFriendshipOutbox(eventType, friendshipId, List.of(recipientId));
            writeAuditLog(callerId, auditAction, "FRIENDSHIP", friendshipId,
                    "requesterId=" + requesterId + ",addresseeId=" + addresseeId);
            return;
        }

        ObligationDecision decision = splitObligationPolicy.checkPair(requesterId, addresseeId);
        if (decision != ObligationDecision.CLEAR) {
            throw new FriendApiException(FriendErrorCode.OUTSTANDING_SPLIT_OBLIGATIONS);
        }

        UUID otherEndpoint = requesterId.equals(callerId) ? addresseeId : requesterId;
        friendshipRepository.delete(friendship);
        friendshipRepository.flush();

        writeFriendshipOutbox("FRIEND_REMOVED", friendshipId, List.of(otherEndpoint));
        writeAuditLog(callerId, "FRIEND_REMOVED", "FRIENDSHIP", friendshipId,
                "requesterId=" + requesterId + ",addresseeId=" + addresseeId);
    }

    private long countRelationshipsForCap(UUID userId) {
        if (properties.isGuestsCountTowardFriendCap()) {
            return friendshipRepository.countByParticipantAndStatusIn(userId, CAP_STATUSES);
        }
        return friendshipRepository.countUserRelationshipsByStatusIn(userId, CAP_STATUSES);
    }

    private FriendApiException resolveMissingFriendshipOnAccept(UUID callerId, UUID friendshipId) {
        List<FriendAuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc("FRIENDSHIP", friendshipId);
        for (FriendAuditLog entry : logs) {
            if (("FRIEND_REQUEST_CANCELLED".equals(entry.getAction()) || "FRIEND_REQUEST_DECLINED".equals(entry.getAction()))
                    && entry.getMetadata() != null
                    && entry.getMetadata().contains("addresseeId=" + callerId)) {
                return new FriendApiException(FriendErrorCode.REQUEST_NOT_PENDING);
            }
        }
        return new FriendApiException(FriendErrorCode.FRIENDSHIP_NOT_FOUND);
    }

    private ParticipantSummaryDto buildUserSummary(User user) {
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        return new ParticipantSummaryDto(
                user.getId(),
                user.getName(),
                profile != null ? profile.getUsername() : null,
                profile != null ? profile.getAvatarId() : null,
                false
        );
    }

    private void writeFriendshipOutbox(String eventType, UUID friendshipId, List<UUID> recipientIds) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("type", eventType);
        payload.put("friendshipId", friendshipId.toString());
        payload.put("occurredAt", Instant.now().toString());
        payload.put("recipientIds", recipientIds.stream().map(UUID::toString).toList());

        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxEventRepository.save(new OutboxEvent("FRIENDSHIP", friendshipId.toString(), eventType, json));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize friend outbox event", ex);
        }
    }

    private void writeAuditLog(UUID actorId, String action, String targetType, UUID targetId, String metadata) {
        auditLogRepository.save(new FriendAuditLog(
                actorId,
                action,
                targetType,
                targetId,
                metadata,
                MDC.get("requestId")
        ));
    }
}
