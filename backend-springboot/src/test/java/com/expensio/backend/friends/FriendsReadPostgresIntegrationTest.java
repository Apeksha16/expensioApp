package com.expensio.backend.friends;

import com.expensio.backend.friends.domain.Friendship;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.domain.GuestProfile;
import com.expensio.backend.friends.domain.Participant;
import com.expensio.backend.friends.domain.ParticipantKind;
import com.expensio.backend.friends.dto.FriendSearchResponse;
import com.expensio.backend.friends.dto.FriendsListResponse;
import com.expensio.backend.friends.dto.ParticipantSummaryDto;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.friends.service.FriendsReadService;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.datasource.driver-class-name=org.postgresql.Driver"
})
@Testcontainers(disabledWithoutDocker = true)
class FriendsReadPostgresIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("expensio_test")
            .withUsername("expensio")
            .withPassword("expensio");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private FriendsReadService friendsReadService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private GuestRepository guestRepository;

    private User createUser(String name, String username) {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        User user = userRepository.saveAndFlush(new User(null, "p1-" + unique + "@example.com", name));
        UserProfile profile = new UserProfile(user.getId());
        profile.setUsername(username + "_" + unique);
        profile.setAvatarId("avatar_1");
        userProfileRepository.saveAndFlush(profile);
        return user;
    }

    @Test
    @DisplayName("List friends is strictly scoped to caller and excludes other users' relationships")
    void listFriends_ScopedToCaller() {
        User caller = createUser("Caller One", "caller_one");
        User friend = createUser("Friend One", "friend_one");
        User strangerA = createUser("Stranger A", "stranger_a");
        User strangerB = createUser("Stranger B", "stranger_b");

        friendshipRepository.saveAndFlush(new Friendship(caller.getId(), friend.getId(), FriendshipStatus.ACCEPTED));
        friendshipRepository.saveAndFlush(new Friendship(strangerA.getId(), strangerB.getId(), FriendshipStatus.ACCEPTED));

        FriendsListResponse response = friendsReadService.listFriends(caller.getId(), null, 50);
        assertThat(response.accepted()).hasSize(1);
        assertThat(response.accepted().get(0).participant().id()).isEqualTo(friend.getId());
        assertThat(response.counts().accepted()).isEqualTo(1);
    }

    @Test
    @DisplayName("Search excludes caller, guests, related accounts, capped accounts, and treats %/_ literally")
    void searchUsers_EnforcesExclusionsAndLiteralWildcards() {
        String tag = UUID.randomUUID().toString().substring(0, 6);
        User caller = createUser("Alpha " + tag, "alpha_" + tag);
        User related = createUser("Alpha Related " + tag, "alpha_rel_" + tag);
        User capped = createUser("Alpha Capped " + tag, "alpha_cap_" + tag);
        User literalMatch = createUser("50% " + tag, "fifty_pct_" + tag);
        User eligible = createUser("Alpha Eligible " + tag, "alpha_elig_" + tag);

        // Related to caller
        friendshipRepository.saveAndFlush(new Friendship(caller.getId(), related.getId(), FriendshipStatus.PENDING));

        // Guest with matching name
        UUID guestId = UUID.randomUUID();
        participantRepository.saveAndFlush(new Participant(guestId, ParticipantKind.GUEST));
        guestRepository.saveAndFlush(new GuestProfile(guestId, caller.getId(), "Alpha Guest " + tag, "alpha_guest", "avatar_2"));

        // Capped user (10 relationships)
        for (int i = 0; i < 10; i++) {
            User other = createUser("Filler " + i, "filler_" + i);
            friendshipRepository.saveAndFlush(new Friendship(capped.getId(), other.getId(), FriendshipStatus.ACCEPTED));
        }

        FriendSearchResponse res = friendsReadService.searchUsers(caller.getId(), "Alpha " + tag, null, 50);
        List<UUID> returnedIds = res.items().stream().map(ParticipantSummaryDto::id).toList();
        assertThat(returnedIds).containsExactly(eligible.getId());

        // Literal wildcard check: "50%" must only match literalMatch, not eligible
        FriendSearchResponse wildcardRes = friendsReadService.searchUsers(caller.getId(), "50% " + tag, null, 50);
        assertThat(wildcardRes.items()).extracting(ParticipantSummaryDto::id).containsExactly(literalMatch.getId());
    }

    @Test
    @DisplayName("Search pagination returns stable non-overlapping pages")
    void searchUsers_PaginationIsStableAndNonOverlapping() {
        String tag = UUID.randomUUID().toString().substring(0, 6);
        User caller = createUser("Caller Pag", "caller_pag_" + tag);
        Set<UUID> created = new HashSet<>();
        for (int i = 0; i < 5; i++) {
            created.add(createUser("PagUser " + tag + " " + i, "pag_" + tag + "_" + i).getId());
        }

        List<UUID> collected = new ArrayList<>();
        String cursor = null;
        do {
            FriendSearchResponse page = friendsReadService.searchUsers(caller.getId(), "PagUser " + tag, cursor, 2);
            page.items().forEach(item -> collected.add(item.id()));
            cursor = page.nextCursor();
        } while (cursor != null);

        assertThat(collected).hasSize(5);
        assertThat(new HashSet<>(collected)).isEqualTo(created);
    }
}
