package com.expensio.backend.friends.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGuestRequest(
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must not exceed 100 characters")
        String name,

        @NotBlank(message = "username is required")
        @Size(min = 2, max = 50, message = "username must be between 2 and 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9_.-]+$", message = "username may only contain letters, numbers, underscores, dots, and hyphens")
        String username,

        String avatarId
) {
}
