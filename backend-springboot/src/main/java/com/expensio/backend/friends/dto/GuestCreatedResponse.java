package com.expensio.backend.friends.dto;

import java.util.UUID;

public record GuestCreatedResponse(
        GuestSummaryDto guest,
        UUID friendshipId
) {
}
