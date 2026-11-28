package com.expensio.backend.friends.service;

import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.dto.*;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import com.expensio.backend.friends.repository.FriendReadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FriendsReadService {

    private final FriendReadRepository friendReadRepository;
    private final FriendsProperties properties;
    private final FriendsRateLimiter rateLimiter;

    public FriendsReadService(FriendReadRepository friendReadRepository, FriendsProperties properties) {
        this(friendReadRepository, properties, new FriendsRateLimiter());
    }

    @Autowired
    public FriendsReadService(
            FriendReadRepository friendReadRepository,
            FriendsProperties properties,
            FriendsRateLimiter rateLimiter) {
        this.friendReadRepository = friendReadRepository;
        this.properties = properties;
        this.rateLimiter = rateLimiter;
    }

    public FriendsListResponse listFriends(UUID callerId, String cursor, Integer limit) {
        int resolvedLimit = resolveLimit(limit);

        Instant cursorCreatedAt = null;
        UUID cursorId = null;
        if (cursor != null && !cursor.isBlank()) {
            CursorCodec.FriendshipCursor decoded = CursorCodec.decodeFriendshipCursor(cursor.trim());
            cursorCreatedAt = decoded.createdAt();
            cursorId = decoded.id();
        }

        List<FriendItemDto> fetched = friendReadRepository.findUserFriendshipsPage(
                callerId,
                cursorCreatedAt,
                cursorId,
                resolvedLimit + 1
        );

        boolean hasMore = fetched.size() > resolvedLimit;
        List<FriendItemDto> pageItems = hasMore ? fetched.subList(0, resolvedLimit) : fetched;

        List<FriendItemDto> accepted = new ArrayList<>();
        List<FriendItemDto> incoming = new ArrayList<>();
        List<FriendItemDto> outgoing = new ArrayList<>();

        for (FriendItemDto item : pageItems) {
            if (item.status() == FriendshipStatus.ACCEPTED) {
                accepted.add(item);
            } else if (item.direction() == FriendshipDirection.INCOMING) {
                incoming.add(item);
            } else {
                outgoing.add(item);
            }
        }

        String nextCursor = null;
        if (hasMore && !pageItems.isEmpty()) {
            FriendItemDto last = pageItems.get(pageItems.size() - 1);
            nextCursor = CursorCodec.encodeFriendshipCursor(last.createdAt(), last.friendshipId());
        }

        List<GuestSummaryDto> guests = friendReadRepository.findActiveGuests(callerId);
        FriendReadRepository.RelationshipCounts rawCounts = friendReadRepository.countRelationships(callerId);

        long totalUsed = rawCounts.accepted() + rawCounts.incoming() + rawCounts.outgoing()
                + (properties.isGuestsCountTowardFriendCap() ? rawCounts.guests() : 0L);

        FriendsCountsDto counts = new FriendsCountsDto(
                rawCounts.accepted(),
                rawCounts.incoming(),
                rawCounts.outgoing(),
                rawCounts.guests(),
                totalUsed,
                properties.getFriendCap(),
                properties.getGuestCap()
        );

        return new FriendsListResponse(accepted, incoming, outgoing, guests, counts, nextCursor, hasMore);
    }

    public FriendSearchResponse searchUsers(UUID callerId, String query, String cursor, Integer limit) {
        rateLimiter.checkAndConsume(
                "friends_search",
                callerId.toString(),
                properties.getRateLimit().getSearchPerMinute(),
                60
        );
        String normalizedQuery = normalizeAndValidateQuery(query);
        int resolvedLimit = resolveLimit(limit);

        String cursorSortKey = null;
        UUID cursorId = null;
        if (cursor != null && !cursor.isBlank()) {
            CursorCodec.SearchCursor decoded = CursorCodec.decodeSearchCursor(cursor.trim());
            cursorSortKey = decoded.sortKey();
            cursorId = decoded.id();
        }

        String pattern = "%" + escapeLikeWildcards(normalizedQuery) + "%";

        List<FriendReadRepository.SearchCandidateRow> fetched = friendReadRepository.searchEligibleUsers(
                callerId,
                pattern,
                properties.getFriendCap(),
                properties.isGuestsCountTowardFriendCap(),
                cursorSortKey,
                cursorId,
                resolvedLimit + 1
        );

        boolean hasMore = fetched.size() > resolvedLimit;
        List<FriendReadRepository.SearchCandidateRow> pageRows = hasMore ? fetched.subList(0, resolvedLimit) : fetched;

        List<ParticipantSummaryDto> items = pageRows.stream()
                .map(FriendReadRepository.SearchCandidateRow::participant)
                .toList();

        String nextCursor = null;
        if (hasMore && !pageRows.isEmpty()) {
            FriendReadRepository.SearchCandidateRow last = pageRows.get(pageRows.size() - 1);
            nextCursor = CursorCodec.encodeSearchCursor(last.sortKey(), last.participant().id());
        }

        return new FriendSearchResponse(items, nextCursor, hasMore);
    }

    private int resolveLimit(Integer limit) {
        if (limit == null) {
            return properties.getSearch().getDefaultLimit();
        }
        int maxLimit = properties.getSearch().getMaxLimit();
        if (limit < 1 || limit > maxLimit) {
            throw new FriendApiException(
                    FriendErrorCode.VALIDATION_ERROR,
                    "Limit must be between 1 and " + maxLimit,
                    Map.of("limit", "Must be between 1 and " + maxLimit)
            );
        }
        return limit;
    }

    private String normalizeAndValidateQuery(String query) {
        String trimmed = query == null ? "" : query.trim();
        int min = properties.getSearch().getMinQueryLength();
        int max = properties.getSearch().getMaxQueryLength();
        if (trimmed.length() < min || trimmed.length() > max) {
            throw new FriendApiException(
                    FriendErrorCode.VALIDATION_ERROR,
                    "Search query must be between " + min + " and " + max + " characters",
                    Map.of("q", "Must be between " + min + " and " + max + " characters")
            );
        }
        return trimmed.toLowerCase(Locale.ROOT);
    }

    static String escapeLikeWildcards(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
