package com.expensio.backend.friends.dto;

public record FriendsCountsDto(
        long accepted,
        long incoming,
        long outgoing,
        long guests,
        long totalUsed,
        int friendCap,
        int guestCap
) {
}
