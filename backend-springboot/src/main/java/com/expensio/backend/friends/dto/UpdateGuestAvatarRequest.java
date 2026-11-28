package com.expensio.backend.friends.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateGuestAvatarRequest(
        @NotBlank(message = "avatarId is required")
        String avatarId
) {
}
