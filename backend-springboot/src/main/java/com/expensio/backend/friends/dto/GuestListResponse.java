package com.expensio.backend.friends.dto;

import java.util.List;

public record GuestListResponse(
        List<GuestSummaryDto> guests,
        int count,
        int limit
) {
}
