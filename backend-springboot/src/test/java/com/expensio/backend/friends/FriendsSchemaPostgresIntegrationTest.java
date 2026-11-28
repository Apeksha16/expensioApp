package com.expensio.backend.friends;

import com.expensio.backend.friends.domain.Friendship;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.domain.GuestProfile;
import com.expensio.backend.friends.domain.Participant;
import com.expensio.backend.friends.domain.ParticipantKind;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.datasource.driver-class-name=org.postgresql.Driver"
})
@Testcontainers(disabledWithoutDocker = true)
class FriendsSchemaPostgresIntegrationTest {

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
    private UserRepository userRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Test
    @DisplayName("Users are automatically registered in participants table via Flyway trigger")
    void usersInsert_RegistersParticipantAutomatically() {
        User user = userRepository.saveAndFlush(new User(null, "p0-trigger-" + UUID.randomUUID() + "@example.com", "Alice"));

        Participant participant = participantRepository.findById(user.getId()).orElseThrow();
        assertThat(participant.getKind()).isEqualTo(ParticipantKind.USER);
    }

    @Test
    @DisplayName("Database rejects self-friendship via CHECK constraint")
    void database_RejectsSelfFriendship() {
        User user = userRepository.saveAndFlush(new User(null, "p0-self-" + UUID.randomUUID() + "@example.com", "Self User"));

        Friendship selfFriendship = new Friendship(user.getId(), user.getId(), FriendshipStatus.PENDING);
        assertThatThrownBy(() -> friendshipRepository.saveAndFlush(selfFriendship))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Database rejects duplicate unordered pair (A->B twice and A->B then B->A)")
    void database_RejectsDuplicateUnorderedPair() {
        User userA = userRepository.saveAndFlush(new User(null, "p0-a-" + UUID.randomUUID() + "@example.com", "User A"));
        User userB = userRepository.saveAndFlush(new User(null, "p0-b-" + UUID.randomUUID() + "@example.com", "User B"));

        friendshipRepository.saveAndFlush(new Friendship(userA.getId(), userB.getId(), FriendshipStatus.PENDING));

        Friendship sameDirection = new Friendship(userA.getId(), userB.getId(), FriendshipStatus.PENDING);
        assertThatThrownBy(() -> friendshipRepository.saveAndFlush(sameDirection))
                .isInstanceOf(DataIntegrityViolationException.class);

        Friendship reverseDirection = new Friendship(userB.getId(), userA.getId(), FriendshipStatus.PENDING);
        assertThatThrownBy(() -> friendshipRepository.saveAndFlush(reverseDirection))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Database rejects case-insensitive duplicate guest username per owner")
    void database_RejectsCaseInsensitiveDuplicateGuestUsernamePerOwner() {
        User owner = userRepository.saveAndFlush(new User(null, "p0-owner-" + UUID.randomUUID() + "@example.com", "Owner"));

        UUID guest1Id = UUID.randomUUID();
        participantRepository.saveAndFlush(new Participant(guest1Id, ParticipantKind.GUEST));
        guestRepository.saveAndFlush(new GuestProfile(guest1Id, owner.getId(), "Guest One", "Alex_Guest", "avatar_1"));

        UUID guest2Id = UUID.randomUUID();
        participantRepository.saveAndFlush(new Participant(guest2Id, ParticipantKind.GUEST));
        GuestProfile duplicate = new GuestProfile(guest2Id, owner.getId(), "Guest Two", "alex_guest", "avatar_2");

        assertThatThrownBy(() -> guestRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
