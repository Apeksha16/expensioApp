package com.expensio.backend.friends.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FriendRealtimeEvent(
        UUID eventId,
        String type,
        UUID friendshipId,
        UUID guestId,
        Instant occurredAt
) {
}
