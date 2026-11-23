package com.expensio.backend.outbox;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxRelaySchedulerTest {

    private final List<OutboxEvent> outboxDb = new ArrayList<>();
    private final List<Object> publishedEvents = new ArrayList<>();
    private boolean failPublish = false;

    private OutboxRelayScheduler scheduler;

    @BeforeEach
    void setUp() {
        outboxDb.clear();
        publishedEvents.clear();
        failPublish = false;

        OutboxEventRepository repoProxy = (OutboxEventRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{OutboxEventRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findTop50ByStatusOrderByCreatedAtAsc".equals(methodName)) {
                        String status = (String) args[0];
                        return outboxDb.stream()
                                .filter(e -> status.equals(e.getStatus()))
                                .limit(50)
                                .toList();
                    } else if ("save".equals(methodName)) {
                        OutboxEvent saved = (OutboxEvent) args[0];
                        if (saved.getId() == null) {
                            outboxDb.add(saved);
                        }
                        return saved;
                    }
                    return null;
                }
        );

        ApplicationEventPublisher publisher = event -> {
            if (failPublish) {
                throw new RuntimeException("Simulated publisher failure");
            }
            publishedEvents.add(event);
        };

        scheduler = new OutboxRelayScheduler(repoProxy, publisher);
    }

    @Test
    @DisplayName("Should do nothing when there are no pending events")
    void testNoPendingEvents() {
        scheduler.processOutboxEvents();
        assertThat(publishedEvents).isEmpty();
    }

    @Test
    @DisplayName("Should successfully process pending outbox events and set status to PROCESSED")
    void testProcessPendingEventsSuccessfully() {
        OutboxEvent event = new OutboxEvent("USER", UUID.randomUUID().toString(), "USER_ONBOARDED", "{\"username\":\"ishita\"}");
        outboxDb.add(event);

        scheduler.processOutboxEvents();

        assertThat(publishedEvents).hasSize(1);
        assertThat(event.getStatus()).isEqualTo("PROCESSED");
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should increment retryCount on dispatch error and set FAILED after 5 retries")
    void testFailureRetryAndFailedStatus() {
        OutboxEvent event = new OutboxEvent("USER", UUID.randomUUID().toString(), "USER_ONBOARDED", "{}");
        event.setRetryCount(4); // 4 existing retries, 5th will trigger FAILED
        outboxDb.add(event);

        failPublish = true;
        scheduler.processOutboxEvents();

        assertThat(publishedEvents).isEmpty();
        assertThat(event.getRetryCount()).isEqualTo(5);
        assertThat(event.getStatus()).isEqualTo("FAILED");
    }
}
