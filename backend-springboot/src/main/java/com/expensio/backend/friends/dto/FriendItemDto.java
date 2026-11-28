package com.expensio.backend.friends.dto;

import com.expensio.backend.friends.domain.FriendshipStatus;

import java.time.Instant;
import java.util.UUID;

public record FriendItemDto(
        UUID friendshipId,
        FriendshipStatus status,
        FriendshipDirection direction,
        Instant createdAt,
        Instant acceptedAt,
        ParticipantSummaryDto participant
) {
}
