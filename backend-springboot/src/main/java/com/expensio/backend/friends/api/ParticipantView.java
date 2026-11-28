package com.expensio.backend.friends.api;

import java.util.UUID;

public record ParticipantView(
        UUID id,
        String displayName,
        String username,
        String avatarId,
        boolean isGuest,
        boolean retired
) {
}
