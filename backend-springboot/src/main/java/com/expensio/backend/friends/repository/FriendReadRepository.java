package com.expensio.backend.friends.repository;

import com.expensio.backend.friends.dto.FriendItemDto;
import com.expensio.backend.friends.dto.GuestSummaryDto;
import com.expensio.backend.friends.dto.ParticipantSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FriendReadRepository {

    record RelationshipCounts(long accepted, long incoming, long outgoing, long guests) {
    }

    record SearchCandidateRow(ParticipantSummaryDto participant, String sortKey) {
    }

    List<FriendItemDto> findUserFriendshipsPage(
            UUID callerId,
            Instant cursorCreatedAt,
            UUID cursorId,
            int limitPlusOne
    );

    List<GuestSummaryDto> findActiveGuests(UUID callerId);

    RelationshipCounts countRelationships(UUID callerId);

    List<SearchCandidateRow> searchEligibleUsers(
            UUID callerId,
            String escapedLikePattern,
            int friendCap,
            boolean guestsCountTowardFriendCap,
            String cursorSortKey,
            UUID cursorId,
            int limitPlusOne
    );
}
