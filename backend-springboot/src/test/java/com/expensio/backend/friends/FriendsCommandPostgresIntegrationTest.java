package com.expensio.backend.friends;

import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.service.FriendsCommandService;
import com.expensio.backend.outbox.OutboxEventRepository;
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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.datasource.driver-class-name=org.postgresql.Driver"
})
@Testcontainers(disabledWithoutDocker = true)
class FriendsCommandPostgresIntegrationTest {

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
    private FriendsCommandService commandService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    private User createUser(String name) {
        return userRepository.saveAndFlush(new User(null, "p2-" + UUID.randomUUID() + "@example.com", name));
    }

    @Test
    @DisplayName("Parallel requests for the same unordered pair produce exactly one friendship row")
    void parallelRequestsForSamePair_ProduceExactlyOneRow() throws Exception {
        User userA = createUser("Conc A");
        User userB = createUser("Conc B");

        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch startGate = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            final boolean forward = (i % 2 == 0);
            futures.add(pool.submit(() -> {
                startGate.await();
                try {
                    if (forward) {
                        commandService.sendRequest(userA.getId(), userB.getId());
                    } else {
                        commandService.sendRequest(userB.getId(), userA.getId());
                    }
                    successes.incrementAndGet();
                } catch (Exception ignored) {
                    // Expected for losing concurrent requests
                }
                return null;
            }));
        }

        startGate.countDown();
        for (Future<?> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(successes.get()).isEqualTo(1);
        assertThat(friendshipRepository.findBetween(userA.getId(), userB.getId())).isPresent();
    }

    @Test
    @DisplayName("Parallel requests from one user respect the 10-relationship cap")
    void parallelRequests_EnforceCapOfTen() throws Exception {
        User caller = createUser("Cap Caller");
        List<User> targets = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            targets.add(createUser("Cap Target " + i));
        }

        ExecutorService pool = Executors.newFixedThreadPool(10);
        CountDownLatch startGate = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        for (User target : targets) {
            futures.add(pool.submit(() -> {
                startGate.await();
                try {
                    commandService.sendRequest(caller.getId(), target.getId());
                    successes.incrementAndGet();
                } catch (Exception ignored) {
                }
                return null;
            }));
        }

        startGate.countDown();
        for (Future<?> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(successes.get()).isEqualTo(10);
        long total = friendshipRepository.countByParticipantAndStatusIn(
                caller.getId(), List.of(FriendshipStatus.PENDING, FriendshipStatus.ACCEPTED));
        assertThat(total).isEqualTo(10);
    }

    @Test
    @DisplayName("Outbox event is written on commit and absent on failed/rolled-back request")
    void outbox_WrittenOnCommit_AbsentOnFailure() {
        User userA = createUser("Outbox A");
        User userB = createUser("Outbox B");

        long before = outboxEventRepository.count();
        commandService.sendRequest(userA.getId(), userB.getId());
        assertThat(outboxEventRepository.count()).isEqualTo(before + 1);

        long afterValid = outboxEventRepository.count();
        try {
            commandService.sendRequest(userA.getId(), userB.getId());
        } catch (Exception ignored) {
        }
        assertThat(outboxEventRepository.count()).isEqualTo(afterValid);
    }
}
