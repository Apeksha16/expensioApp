package com.expensio.backend.friends.service;

import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.domain.*;
import com.expensio.backend.friends.dto.*;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import com.expensio.backend.friends.policy.ObligationDecision;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.repository.FriendAuditLogRepository;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class GuestService {

    private static final List<FriendshipStatus> CAP_STATUSES =
            List.of(FriendshipStatus.PENDING, FriendshipStatus.ACCEPTED);

    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;
    private final GuestRepository guestRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendAuditLogRepository auditLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final SplitObligationPolicy splitObligationPolicy;
    private final FriendsProperties properties;
    private final ObjectMapper objectMapper;
    private final FriendsRateLimiter rateLimiter;

    public GuestService(
            UserRepository userRepository,
            ParticipantRepository participantRepository,
            GuestRepository guestRepository,
            FriendshipRepository friendshipRepository,
            FriendAuditLogRepository auditLogRepository,
            OutboxEventRepository outboxEventRepository,
            SplitObligationPolicy splitObligationPolicy,
            FriendsProperties properties,
            ObjectMapper objectMapper) {
        this(userRepository, participantRepository, guestRepository, friendshipRepository,
                auditLogRepository, outboxEventRepository, splitObligationPolicy, properties,
                objectMapper, new FriendsRateLimiter());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public GuestService(
            UserRepository userRepository,
            ParticipantRepository participantRepository,
            GuestRepository guestRepository,
            FriendshipRepository friendshipRepository,
            FriendAuditLogRepository auditLogRepository,
            OutboxEventRepository outboxEventRepository,
            SplitObligationPolicy splitObligationPolicy,
            FriendsProperties properties,
            ObjectMapper objectMapper,
            FriendsRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.participantRepository = participantRepository;
        this.guestRepository = guestRepository;
        this.friendshipRepository = friendshipRepository;
        this.auditLogRepository = auditLogRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.splitObligationPolicy = splitObligationPolicy;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
    }

    @Transactional(readOnly = true)
    public GuestListResponse listGuests(UUID ownerId) {
        List<GuestSummaryDto> guests = guestRepository
                .findByOwnerUserIdAndRetiredAtIsNullOrderByCreatedAtAscIdAsc(ownerId)
                .stream()
                .map(this::toSummary)
                .toList();
        return new GuestListResponse(guests, guests.size(), properties.getGuestCap());
    }

    @Transactional
    public GuestCreatedResponse createGuest(UUID ownerId, CreateGuestRequest request) {
        rateLimiter.checkAndConsume(
                "guest_create",
                ownerId.toString(),
                properties.getRateLimit().getGuestCreatePerMinute(),
                60
        );
        userRepository.findByIdForUpdate(ownerId)
                .orElseThrow(() -> new FriendApiException(FriendErrorCode.UNAUTHORIZED));

        long activeGuestCount = guestRepository.countByOwnerUserIdAndRetiredAtIsNull(ownerId);
        if (activeGuestCount >= properties.getGuestCap()) {
            throw new FriendApiException(FriendErrorCode.GUEST_LIMIT_REACHED);
        }

        if (properties.isGuestsCountTowardFriendCap()) {
            long totalUsed = friendshipRepository.countByParticipantAndStatusIn(ownerId, CAP_STATUSES);
            if (totalUsed >= properties.getFriendCap()) {
                throw new FriendApiException(FriendErrorCode.FRIEND_LIMIT_REACHED);
            }
        }

        String normalizedName = normalizeAndValidateName(request.name());

        String normalizedUsername = request.username().trim().toLowerCase(Locale.ROOT);
        String resolvedAvatar = resolveAndValidateAvatar(request.avatarId());

        if (guestRepository.existsByOwnerUserIdAndNormalizedUsername(ownerId, normalizedUsername)) {
            throw new FriendApiException(FriendErrorCode.USERNAME_TAKEN);
        }

        UUID guestId = UUID.randomUUID();
        GuestProfile savedGuest;
        Friendship savedFriendship;
        try {
            participantRepository.saveAndFlush(new Participant(guestId, ParticipantKind.GUEST));
            savedGuest = guestRepository.saveAndFlush(
                    new GuestProfile(guestId, ownerId, normalizedName, normalizedUsername, resolvedAvatar));
            savedFriendship = friendshipRepository.saveAndFlush(
                    new Friendship(ownerId, guestId, FriendshipStatus.ACCEPTED));
        } catch (DataIntegrityViolationException ex) {
            throw new FriendApiException(FriendErrorCode.USERNAME_TAKEN);
        }

        writeGuestOutbox("GUEST_CREATED", guestId, ownerId);
        writeAuditLog(ownerId, "GUEST_CREATED", "GUEST", guestId,
                "username=" + normalizedUsername);

        return new GuestCreatedResponse(toSummary(savedGuest), savedFriendship.getId());
    }

    @Transactional
    public GuestSummaryDto updateGuestName(UUID callerId, UUID guestId, UpdateGuestNameRequest request) {
        GuestProfile guest = lockOwnedActiveGuest(callerId, guestId);
        String normalizedName = normalizeAndValidateName(request.name());

        guest.setName(normalizedName);
        GuestProfile saved = guestRepository.saveAndFlush(guest);

        writeGuestOutbox("GUEST_UPDATED", guestId, callerId);
        writeAuditLog(callerId, "GUEST_UPDATED", "GUEST", guestId, "nameUpdated=true");

        return toSummary(saved);
    }

    @Transactional
    public GuestSummaryDto updateGuestAvatar(UUID callerId, UUID guestId, UpdateGuestAvatarRequest request) {
        rateLimiter.checkAndConsume(
                "guest_avatar",
                callerId.toString(),
                properties.getRateLimit().getGuestAvatarPerMinute(),
                60
        );
        String avatarId = validateAvatarId(request.avatarId());
        GuestProfile guest = lockOwnedActiveGuest(callerId, guestId);

        guest.setAvatarId(avatarId);
        GuestProfile saved = guestRepository.saveAndFlush(guest);

        writeGuestOutbox("GUEST_UPDATED", guestId, callerId);
        writeAuditLog(callerId, "GUEST_AVATAR_UPDATED", "GUEST", guestId, "avatarId=" + avatarId);

        return toSummary(saved);
    }

    @Transactional
    public void retireGuest(UUID callerId, UUID guestId) {
        GuestProfile guest = lockOwnedActiveGuest(callerId, guestId);

        ObligationDecision decision = splitObligationPolicy.checkGuest(guestId);
        if (decision != ObligationDecision.CLEAR) {
            throw new FriendApiException(FriendErrorCode.OUTSTANDING_SPLIT_OBLIGATIONS);
        }

        guest.setRetiredAt(Instant.now());
        guestRepository.saveAndFlush(guest);

        friendshipRepository.findBetween(callerId, guestId).ifPresent(friendship -> {
            friendshipRepository.delete(friendship);
            friendshipRepository.flush();
        });

        writeGuestOutbox("GUEST_RETIRED", guestId, callerId);
        writeAuditLog(callerId, "GUEST_RETIRED", "GUEST", guestId, "retired=true");
    }

    private String normalizeAndValidateName(String rawName) {
        String normalized = rawName == null ? "" : rawName.trim();
        if (normalized.isEmpty() || normalized.length() > 100 || normalized.chars().anyMatch(Character::isISOControl)) {
            throw new FriendApiException(
                    FriendErrorCode.VALIDATION_ERROR,
                    "Guest name must be 1 to 100 printable characters",
                    Map.of("name", "must be 1 to 100 printable characters")
            );
        }
        return normalized;
    }

    private GuestProfile lockOwnedActiveGuest(UUID callerId, UUID guestId) {
        GuestProfile guest = guestRepository.findByIdForUpdate(guestId)
                .orElseThrow(() -> new FriendApiException(FriendErrorCode.GUEST_NOT_FOUND));

        if (!guest.getOwnerUserId().equals(callerId)) {
            throw new FriendApiException(FriendErrorCode.GUEST_NOT_OWNED);
        }
        if (guest.isRetired()) {
            throw new FriendApiException(FriendErrorCode.GUEST_ALREADY_RETIRED);
        }
        return guest;
    }

    private String resolveAndValidateAvatar(String avatarId) {
        if (avatarId == null || avatarId.isBlank()) {
            List<String> allowlist = properties.getAvatarAllowlist();
            return allowlist.isEmpty() ? null : allowlist.get(0);
        }
        return validateAvatarId(avatarId);
    }

    private String validateAvatarId(String avatarId) {
        String trimmed = avatarId == null ? "" : avatarId.trim();
        if (trimmed.isEmpty() || !properties.getAvatarAllowlist().contains(trimmed)) {
            throw new FriendApiException(
                    FriendErrorCode.INVALID_AVATAR,
                    "Avatar ID is not in the allowed list",
                    Map.of("avatarId", "must be a valid allowlisted avatar ID")
            );
        }
        return trimmed;
    }

    private GuestSummaryDto toSummary(GuestProfile guest) {
        return new GuestSummaryDto(
                guest.getId(),
                guest.getName(),
                guest.getUsername(),
                guest.getAvatarId(),
                true,
                guest.getCreatedAt()
        );
    }

    private void writeGuestOutbox(String eventType, UUID guestId, UUID ownerId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("type", eventType);
        payload.put("guestId", guestId.toString());
        payload.put("occurredAt", Instant.now().toString());
        payload.put("recipientIds", List.of(ownerId.toString()));

        try {
            String json = objectMapper.writeValueAsString(payload);
            outboxEventRepository.save(new OutboxEvent("GUEST", guestId.toString(), eventType, json));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize guest outbox event", ex);
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
