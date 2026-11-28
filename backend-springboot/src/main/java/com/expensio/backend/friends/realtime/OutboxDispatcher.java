package com.expensio.backend.friends.realtime;

import com.expensio.backend.friends.push.DeviceToken;
import com.expensio.backend.friends.push.DeviceTokenRepository;
import com.expensio.backend.friends.push.PushGateway;
import com.expensio.backend.friends.push.PushResult;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class OutboxDispatcher {

    private static final Logger log = LoggerFactory.getLogger(OutboxDispatcher.class);
    private static final int BATCH_SIZE = 50;

    private final OutboxEventRepository outboxEventRepository;
    private final NotificationGateway notificationGateway;
    private final ObjectMapper objectMapper;
    private final int maxAttempts;
    private final long baseBackoffSeconds;
    private final WebSocketSessionRegistry webSocketSessionRegistry;
    private final DeviceTokenRepository deviceTokenRepository;
    private final PushGateway pushGateway;

    public OutboxDispatcher(
            OutboxEventRepository outboxEventRepository,
            NotificationGateway notificationGateway,
            ObjectMapper objectMapper,
            int maxAttempts,
            long baseBackoffSeconds) {
        this(outboxEventRepository, notificationGateway, objectMapper, maxAttempts, baseBackoffSeconds,
                null, null, null);
    }

    @Autowired
    public OutboxDispatcher(
            OutboxEventRepository outboxEventRepository,
            NotificationGateway notificationGateway,
            ObjectMapper objectMapper,
            @Value("${app.friends.outbox.max-attempts:5}") int maxAttempts,
            @Value("${app.friends.outbox.base-backoff-seconds:5}") long baseBackoffSeconds,
            WebSocketSessionRegistry webSocketSessionRegistry,
            DeviceTokenRepository deviceTokenRepository,
            PushGateway pushGateway) {
        this.outboxEventRepository = outboxEventRepository;
        this.notificationGateway = notificationGateway;
        this.objectMapper = objectMapper;
        this.maxAttempts = maxAttempts;
        this.baseBackoffSeconds = baseBackoffSeconds;
        this.webSocketSessionRegistry = webSocketSessionRegistry;
        this.deviceTokenRepository = deviceTokenRepository;
        this.pushGateway = pushGateway;
    }

    @Scheduled(fixedDelayString = "${app.friends.outbox.poll-interval-ms:2000}")
    @Transactional
    public void dispatchPendingEvents() {
        List<OutboxEvent> events = outboxEventRepository.findPendingFriendEventsForDispatch(BATCH_SIZE);
        if (events.isEmpty()) {
            return;
        }

        for (OutboxEvent row : events) {
            try {
                JsonNode root = objectMapper.readTree(row.getPayload());
                UUID eventId = UUID.fromString(root.path("eventId").asText());
                String type = root.path("type").asText();
                UUID friendshipId = root.hasNonNull("friendshipId")
                        ? UUID.fromString(root.get("friendshipId").asText())
                        : null;
                UUID guestId = root.hasNonNull("guestId")
                        ? UUID.fromString(root.get("guestId").asText())
                        : null;
                Instant occurredAt = Instant.parse(root.path("occurredAt").asText());

                List<UUID> recipients = new ArrayList<>();
                JsonNode recipientNode = root.path("recipientIds");
                if (recipientNode.isArray()) {
                    for (JsonNode idNode : recipientNode) {
                        recipients.add(UUID.fromString(idNode.asText()));
                    }
                }

                FriendRealtimeEvent thinEvent = new FriendRealtimeEvent(
                        eventId,
                        type,
                        friendshipId,
                        guestId,
                        occurredAt
                );

                for (UUID recipientId : recipients) {
                    notificationGateway.sendFriendEvent(recipientId, thinEvent);
                    dispatchPushIfOffline(recipientId, thinEvent);
                }

                row.setStatus("PROCESSED");
                row.setProcessedAt(Instant.now());
                row.setNextAttemptAt(null);
                outboxEventRepository.save(row);
            } catch (Exception ex) {
                int attempts = row.getRetryCount() + 1;
                row.setRetryCount(attempts);
                if (attempts >= maxAttempts) {
                    row.setStatus("FAILED");
                    row.setNextAttemptAt(null);
                    log.error("Outbox friend event {} failed permanently after {} attempts", row.getId(), attempts, ex);
                } else {
                    long delaySeconds = baseBackoffSeconds * (1L << Math.min(attempts - 1, 10));
                    row.setNextAttemptAt(Instant.now().plusSeconds(delaySeconds));
                    log.warn("Outbox friend event {} dispatch failed (attempt {}/{}), retrying in {}s",
                            row.getId(), attempts, maxAttempts, delaySeconds);
                }
                outboxEventRepository.save(row);
            }
        }
    }

    private void dispatchPushIfOffline(UUID recipientId, FriendRealtimeEvent event) {
        if (webSocketSessionRegistry == null || deviceTokenRepository == null || pushGateway == null) {
            return;
        }
        if (webSocketSessionRegistry.hasActiveSession(recipientId)) {
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndPushEnabledTrue(recipientId);
        for (DeviceToken deviceToken : tokens) {
            PushResult result = pushGateway.sendPush(deviceToken, event);
            if (result == PushResult.INVALID_TOKEN) {
                deviceTokenRepository.delete(deviceToken);
            } else if (result == PushResult.RETRYABLE_ERROR) {
                throw new IllegalStateException("Push delivery failed with retryable error for token " + deviceToken.getId());
            }
        }
    }
}
