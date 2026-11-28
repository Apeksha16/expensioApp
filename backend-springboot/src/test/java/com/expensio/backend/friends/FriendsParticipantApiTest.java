package com.expensio.backend.friends;

import com.expensio.backend.friends.api.FriendsParticipantApi;
import com.expensio.backend.friends.api.ParticipantSnapshot;
import com.expensio.backend.friends.api.ParticipantView;
import com.expensio.backend.friends.domain.Friendship;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.domain.GuestProfile;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.service.FriendsParticipantApiImpl;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FriendsParticipantApiTest {

    private static final UUID USER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID USER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID USER_C = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID ACTIVE_GUEST = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID RETIRED_GUEST = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID UNKNOWN_ID = UUID.fromString("99999999-9999-9999-9999-999999999999");

    private final Map<UUID, User> users = new HashMap<>();
    private final Map<UUID, UserProfile> profiles = new HashMap<>();
    private final Map<UUID, GuestProfile> guests = new HashMap<>();
    private final List<Friendship> friendships = new ArrayList<>();

    private FriendsParticipantApi api;

    @BeforeEach
    void setUp() {
        users.clear();
        profiles.clear();
        guests.clear();
        friendships.clear();

        addUser(USER_A, "Alice", "alice", "avatar_1");
        addUser(USER_B, "Bob", "bob", "avatar_2");
        addUser(USER_C, "Charlie", "charlie", "avatar_3");

        guests.put(ACTIVE_GUEST, new GuestProfile(ACTIVE_GUEST, USER_A, "Active Guest", "active_guest", "avatar_4"));
        GuestProfile retired = new GuestProfile(RETIRED_GUEST, USER_A, "Retired Guest", "retired_guest", "avatar_5");
        retired.setRetiredAt(Instant.now());
        guests.put(RETIRED_GUEST, retired);

        friendships.add(new Friendship(USER_A, USER_B, FriendshipStatus.ACCEPTED));
        friendships.add(new Friendship(USER_A, USER_C, FriendshipStatus.PENDING));

        api = new FriendsParticipantApiImpl(
                userRepositoryProxy(),
                userProfileRepositoryProxy(),
                guestRepositoryProxy(),
                friendshipRepositoryProxy()
        );
    }

    private void addUser(UUID id, String name, String username, String avatarId) {
        User u = new User(null, username + "@example.com", name);
        u.setId(id);
        users.put(id, u);
        UserProfile p = new UserProfile(id);
        p.setUsername(username);
        p.setAvatarId(avatarId);
        profiles.put(id, p);
    }

    @Test
    @DisplayName("resolveParticipants returns real and guest views and omits unknown IDs deterministically")
    void resolveParticipants_ResolvesMixedAndOmitsUnknown() {
        Map<UUID, ParticipantView> resolved = api.resolveParticipants(
                Set.of(USER_A, ACTIVE_GUEST, RETIRED_GUEST, UNKNOWN_ID));

        assertThat(resolved).containsOnlyKeys(USER_A, ACTIVE_GUEST, RETIRED_GUEST);
        assertThat(resolved.get(USER_A).isGuest()).isFalse();
        assertThat(resolved.get(USER_A).displayName()).isEqualTo("Alice");
        assertThat(resolved.get(ACTIVE_GUEST).isGuest()).isTrue();
        assertThat(resolved.get(ACTIVE_GUEST).retired()).isFalse();
        assertThat(resolved.get(RETIRED_GUEST).isGuest()).isTrue();
        assertThat(resolved.get(RETIRED_GUEST).retired()).isTrue();
        assertThatThrownBy(() -> resolved.put(UNKNOWN_ID, null))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    @DisplayName("areFriends returns true only for ACCEPTED friendships")
    void areFriends_OnlyAccepted() {
        assertThat(api.areFriends(USER_A, USER_B)).isTrue();
        assertThat(api.areFriends(USER_B, USER_A)).isTrue();
        assertThat(api.areFriends(USER_A, USER_C)).isFalse(); // PENDING
        assertThat(api.areFriends(USER_B, USER_C)).isFalse(); // NONE
        assertThat(api.areFriends(USER_A, USER_A)).isFalse(); // SELF
    }

    @Test
    @DisplayName("isGuestOwnedBy is true only for active owned guest and false for non-owners or retired guests")
    void isGuestOwnedBy_ChecksOwnerAndActiveState() {
        assertThat(api.isGuestOwnedBy(ACTIVE_GUEST, USER_A)).isTrue();
        assertThat(api.isGuestOwnedBy(ACTIVE_GUEST, USER_B)).isFalse();
        assertThat(api.isGuestOwnedBy(RETIRED_GUEST, USER_A)).isFalse();
        assertThat(api.isGuestOwnedBy(USER_B, USER_A)).isFalse();
        assertThat(api.isGuestOwnedBy(UNKNOWN_ID, USER_A)).isFalse();
    }

    @Test
    @DisplayName("getParticipantSnapshot preserves readable identity for retired guests and throws NOT_FOUND for unknown")
    void getParticipantSnapshot_PreservesHistory() {
        ParticipantSnapshot retiredSnap = api.getParticipantSnapshot(RETIRED_GUEST);
        assertThat(retiredSnap.displayName()).isEqualTo("Retired Guest");
        assertThat(retiredSnap.avatarId()).isEqualTo("avatar_5");
        assertThat(retiredSnap.isGuest()).isTrue();
        assertThat(retiredSnap.retired()).isTrue();

        ParticipantSnapshot userSnap = api.getParticipantSnapshot(USER_B);
        assertThat(userSnap.displayName()).isEqualTo("Bob");
        assertThat(userSnap.isGuest()).isFalse();

        assertThatThrownBy(() -> api.getParticipantSnapshot(UNKNOWN_ID))
                .isInstanceOf(FriendApiException.class);
    }

    private UserRepository userRepositoryProxy() {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(users.get((UUID) args[0]));
                    case "findAllById" -> {
                        @SuppressWarnings("unchecked")
                        Iterable<UUID> ids = (Iterable<UUID>) args[0];
                        List<User> list = new ArrayList<>();
                        ids.forEach(id -> {
                            if (users.containsKey(id)) list.add(users.get(id));
                        });
                        yield list;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private UserProfileRepository userProfileRepositoryProxy() {
        return (UserProfileRepository) Proxy.newProxyInstance(
                UserProfileRepository.class.getClassLoader(),
                new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(profiles.get((UUID) args[0]));
                    case "findAllById" -> {
                        @SuppressWarnings("unchecked")
                        Iterable<UUID> ids = (Iterable<UUID>) args[0];
                        List<UserProfile> list = new ArrayList<>();
                        ids.forEach(id -> {
                            if (profiles.containsKey(id)) list.add(profiles.get(id));
                        });
                        yield list;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private GuestRepository guestRepositoryProxy() {
        return (GuestRepository) Proxy.newProxyInstance(
                GuestRepository.class.getClassLoader(),
                new Class<?>[]{GuestRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(guests.get((UUID) args[0]));
                    case "findByIdAndOwnerUserId" -> {
                        UUID id = (UUID) args[0];
                        UUID owner = (UUID) args[1];
                        GuestProfile g = guests.get(id);
                        yield (g != null && g.getOwnerUserId().equals(owner)) ? Optional.of(g) : Optional.empty();
                    }
                    case "findAllById" -> {
                        @SuppressWarnings("unchecked")
                        Iterable<UUID> ids = (Iterable<UUID>) args[0];
                        List<GuestProfile> list = new ArrayList<>();
                        ids.forEach(id -> {
                            if (guests.containsKey(id)) list.add(guests.get(id));
                        });
                        yield list;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private FriendshipRepository friendshipRepositoryProxy() {
        return (FriendshipRepository) Proxy.newProxyInstance(
                FriendshipRepository.class.getClassLoader(),
                new Class<?>[]{FriendshipRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findBetween" -> {
                        UUID a = (UUID) args[0];
                        UUID b = (UUID) args[1];
                        yield friendships.stream()
                                .filter(f -> (f.getRequesterId().equals(a) && f.getAddresseeId().equals(b))
                                        || (f.getRequesterId().equals(b) && f.getAddresseeId().equals(a)))
                                .findFirst();
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
