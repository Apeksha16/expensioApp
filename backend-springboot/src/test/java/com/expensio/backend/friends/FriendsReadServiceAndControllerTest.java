package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.controller.FriendsController;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.dto.*;
import com.expensio.backend.friends.repository.FriendReadRepository;
import com.expensio.backend.friends.service.CursorCodec;
import com.expensio.backend.friends.service.FriendsReadService;
import com.expensio.backend.security.RequestIdFilter;
import com.expensio.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FriendsReadServiceAndControllerTest {

    private static final UUID CALLER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private StubFriendReadRepository readRepository;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        readRepository = new StubFriendReadRepository();
        FriendsProperties properties = new FriendsProperties();
        FriendsReadService service = new FriendsReadService(readRepository, properties);
        FriendsController controller = new FriendsController(service, null);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                                && parameter.getParameterType().equals(UserPrincipal.class);
                    }

                    @Override
                    public Object resolveArgument(
                            MethodParameter parameter,
                            ModelAndViewContainer mavContainer,
                            NativeWebRequest webRequest,
                            WebDataBinderFactory binderFactory) {
                        return new UserPrincipal(CALLER_ID);
                    }
                })
                .addFilters(new RequestIdFilter())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/friends groups accepted, incoming, outgoing, guests and counts with cursor pagination")
    void listFriends_GroupsResultsAndPaginates() throws Exception {
        UUID f1 = UUID.randomUUID();
        UUID f2 = UUID.randomUUID();
        UUID f3 = UUID.randomUUID();
        Instant now = Instant.parse("2026-11-28T00:00:00Z");

        readRepository.friendshipsToReturn = List.of(
                new FriendItemDto(f1, FriendshipStatus.ACCEPTED, FriendshipDirection.NONE, now, now,
                        new ParticipantSummaryDto(UUID.randomUUID(), "Alice", "alice", "avatar_1", false)),
                new FriendItemDto(f2, FriendshipStatus.PENDING, FriendshipDirection.INCOMING, now.minusSeconds(10), null,
                        new ParticipantSummaryDto(UUID.randomUUID(), "Bob", "bob", "avatar_2", false)),
                new FriendItemDto(f3, FriendshipStatus.PENDING, FriendshipDirection.OUTGOING, now.minusSeconds(20), null,
                        new ParticipantSummaryDto(UUID.randomUUID(), "Charlie", "charlie", "avatar_3", false))
        );
        readRepository.guestsToReturn = List.of(
                new GuestSummaryDto(UUID.randomUUID(), "Guest One", "guest_one", "avatar_4", true, now)
        );
        readRepository.countsToReturn = new FriendReadRepository.RelationshipCounts(1, 1, 1, 1);

        mockMvc.perform(get("/api/v1/friends")
                        .param("limit", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accepted", hasSize(1)))
                .andExpect(jsonPath("$.accepted[0].direction").value("NONE"))
                .andExpect(jsonPath("$.incoming", hasSize(1)))
                .andExpect(jsonPath("$.incoming[0].direction").value("INCOMING"))
                .andExpect(jsonPath("$.outgoing", hasSize(0)))
                .andExpect(jsonPath("$.guests", hasSize(1)))
                .andExpect(jsonPath("$.guests[0].isGuest").value(true))
                .andExpect(jsonPath("$.counts.accepted").value(1))
                .andExpect(jsonPath("$.counts.incoming").value(1))
                .andExpect(jsonPath("$.counts.outgoing").value(1))
                .andExpect(jsonPath("$.counts.guests").value(1))
                .andExpect(jsonPath("$.counts.totalUsed").value(4))
                .andExpect(jsonPath("$.counts.friendCap").value(10))
                .andExpect(jsonPath("$.counts.guestCap").value(5))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/v1/friends rejects invalid cursor and out-of-bounds limit")
    void listFriends_RejectsInvalidCursorAndLimit() throws Exception {
        mockMvc.perform(get("/api/v1/friends").param("cursor", "not-a-valid-cursor"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CURSOR"));

        mockMvc.perform(get("/api/v1/friends").param("limit", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /api/v1/friends/search trims q, escapes LIKE wildcards, and enforces min/max length")
    void searchUsers_NormalizesAndEscapesWildcards() throws Exception {
        UUID u1 = UUID.randomUUID();
        readRepository.searchRowsToReturn = List.of(
                new FriendReadRepository.SearchCandidateRow(
                        new ParticipantSummaryDto(u1, "50% Off", "fifty_pct", "avatar_1", false),
                        "fifty_pct"
                )
        );

        mockMvc.perform(get("/api/v1/friends/search")
                        .param("q", "  50%_test\\  ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(u1.toString()))
                .andExpect(jsonPath("$.items[0].isGuest").value(false))
                .andExpect(jsonPath("$.hasMore").value(false));

        assertThat(readRepository.lastCallerId).isEqualTo(CALLER_ID);
        assertThat(readRepository.lastPattern).isEqualTo("%50\\%\\_test\\\\%");

        mockMvc.perform(get("/api/v1/friends/search").param("q", " a "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/v1/friends/search").param("q", "a".repeat(51)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("CursorCodec round-trips friendship and search cursors")
    void cursorCodec_RoundTrips() {
        Instant ts = Instant.parse("2026-11-28T05:00:00Z");
        UUID id = UUID.randomUUID();

        String fCursor = CursorCodec.encodeFriendshipCursor(ts, id);
        CursorCodec.FriendshipCursor decodedF = CursorCodec.decodeFriendshipCursor(fCursor);
        assertThat(decodedF.createdAt()).isEqualTo(ts);
        assertThat(decodedF.id()).isEqualTo(id);

        String sCursor = CursorCodec.encodeSearchCursor("alice", id);
        CursorCodec.SearchCursor decodedS = CursorCodec.decodeSearchCursor(sCursor);
        assertThat(decodedS.sortKey()).isEqualTo("alice");
        assertThat(decodedS.id()).isEqualTo(id);
    }

    private static class StubFriendReadRepository implements FriendReadRepository {
        List<FriendItemDto> friendshipsToReturn = List.of();
        List<GuestSummaryDto> guestsToReturn = List.of();
        RelationshipCounts countsToReturn = new RelationshipCounts(0, 0, 0, 0);
        List<SearchCandidateRow> searchRowsToReturn = List.of();
        UUID lastCallerId;
        String lastPattern;

        @Override
        public List<FriendItemDto> findUserFriendshipsPage(UUID callerId, Instant cursorCreatedAt, UUID cursorId, int limitPlusOne) {
            return new ArrayList<>(friendshipsToReturn.subList(0, Math.min(limitPlusOne, friendshipsToReturn.size())));
        }

        @Override
        public List<GuestSummaryDto> findActiveGuests(UUID callerId) {
            return guestsToReturn;
        }

        @Override
        public RelationshipCounts countRelationships(UUID callerId) {
            return countsToReturn;
        }

        @Override
        public List<SearchCandidateRow> searchEligibleUsers(
                UUID callerId,
                String escapedLikePattern,
                int friendCap,
                boolean guestsCountTowardFriendCap,
                String cursorSortKey,
                UUID cursorId,
                int limitPlusOne) {
            this.lastCallerId = callerId;
            this.lastPattern = escapedLikePattern;
            return new ArrayList<>(searchRowsToReturn.subList(0, Math.min(limitPlusOne, searchRowsToReturn.size())));
        }
    }
}
