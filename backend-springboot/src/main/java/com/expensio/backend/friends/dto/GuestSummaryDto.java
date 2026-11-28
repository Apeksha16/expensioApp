package com.expensio.backend.friends.dto;

import java.time.Instant;
import java.util.UUID;

public record GuestSummaryDto(
        UUID id,
        String displayName,
        String username,
        String avatarId,
        boolean isGuest,
        Instant createdAt
) {
}
