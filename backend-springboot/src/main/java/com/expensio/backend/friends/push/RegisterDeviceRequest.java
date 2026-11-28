package com.expensio.backend.friends.push;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterDeviceRequest(
        @NotBlank(message = "token is required")
        @Size(max = 512, message = "token must not exceed 512 characters")
        String token,

        @NotNull(message = "platform is required")
        DevicePlatform platform
) {
}
