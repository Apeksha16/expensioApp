package com.expensio.backend.friends.dto;

import java.util.UUID;

public record ParticipantSummaryDto(
        UUID id,
        String displayName,
        String username,
        String avatarId,
        boolean isGuest
) {
}
