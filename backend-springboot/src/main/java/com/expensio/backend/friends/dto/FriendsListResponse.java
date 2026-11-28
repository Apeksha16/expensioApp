package com.expensio.backend.friends.dto;

import java.util.List;

public record FriendsListResponse(
        List<FriendItemDto> accepted,
        List<FriendItemDto> incoming,
        List<FriendItemDto> outgoing,
        List<GuestSummaryDto> guests,
        FriendsCountsDto counts,
        String nextCursor,
        boolean hasMore
) {
}
