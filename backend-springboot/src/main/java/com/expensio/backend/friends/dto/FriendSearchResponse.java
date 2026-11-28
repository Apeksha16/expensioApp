package com.expensio.backend.friends.dto;

import java.util.List;

public record FriendSearchResponse(
        List<ParticipantSummaryDto> items,
        String nextCursor,
        boolean hasMore
) {
}
