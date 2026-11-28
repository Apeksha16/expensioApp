package com.expensio.backend.friends.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendFriendRequestDto(
        @NotNull(message = "addresseeId is required")
        UUID addresseeId
) {
}
