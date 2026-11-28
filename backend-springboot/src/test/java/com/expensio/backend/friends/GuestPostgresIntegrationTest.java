package com.expensio.backend.friends;

import com.expensio.backend.friends.dto.CreateGuestRequest;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.service.GuestService;
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
class GuestPostgresIntegrationTest {

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
    private GuestService guestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Test
    @DisplayName("Concurrent guest creation never exceeds the 5-guest cap")
    void concurrentGuestCreation_NeverExceedsFive() throws Exception {
        User owner = userRepository.saveAndFlush(new User(null, "p3-" + UUID.randomUUID() + "@example.com", "Guest Owner"));

        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch gate = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            final int idx = i;
            futures.add(pool.submit(() -> {
                gate.await();
                try {
                    guestService.createGuest(owner.getId(), new CreateGuestRequest("Guest " + idx, "guest_" + idx, null));
                    successes.incrementAndGet();
                } catch (Exception ignored) {
                }
                return null;
            }));
        }

        gate.countDown();
        for (Future<?> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(successes.get()).isEqualTo(5);
        assertThat(guestRepository.countByOwnerUserIdAndRetiredAtIsNull(owner.getId())).isEqualTo(5);
    }
}
