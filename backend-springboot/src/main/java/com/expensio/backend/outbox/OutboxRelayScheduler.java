package com.expensio.backend.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class OutboxRelayScheduler {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelayScheduler.class);
    private static final int MAX_RETRIES = 5;

    private final OutboxEventRepository outboxEventRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OutboxRelayScheduler(OutboxEventRepository outboxEventRepository, ApplicationEventPublisher eventPublisher) {
        this.outboxEventRepository = outboxEventRepository;
        this.eventPublisher = eventPublisher;
    }

    @Scheduled(fixedDelayString = "${expensio.outbox.poll-interval-ms:5000}")
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findTop50ByStatusOrderByCreatedAtAsc("PENDING");
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Processing {} pending outbox event(s)...", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                // Dispatch event via Spring ApplicationEventPublisher for internal decoupled consumers
                eventPublisher.publishEvent(event);

                event.setStatus("PROCESSED");
                event.setProcessedAt(Instant.now());
                outboxEventRepository.save(event);
                log.info("Successfully processed outbox event: id={}, type={}, aggregateId={}",
                        event.getId(), event.getEventType(), event.getAggregateId());
            } catch (Exception ex) {
                log.error("Failed to process outbox event id={}: {}", event.getId(), ex.getMessage(), ex);
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= MAX_RETRIES) {
                    event.setStatus("FAILED");
                    log.error("Outbox event id={} marked as FAILED after {} retries", event.getId(), event.getRetryCount());
                }
                outboxEventRepository.save(event);
            }
        }
    }
}

