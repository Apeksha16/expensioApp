package com.expensio.backend.friends;

import com.expensio.backend.friends.realtime.*;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FriendsRealtimeTest {

    private JwtService jwtService;
    private WebSocketSessionRegistry sessionRegistry;
    private StompJwtChannelInterceptor interceptor;
    private final MessageChannel dummyChannel = (message, timeout) -> true;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("test_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256_tests!");
        jwtProperties.setAccessTokenExpirationMs(3600000L);
        jwtProperties.setRefreshTokenExpirationMs(86400000L);
        jwtProperties.setIssuer("expensio-api-test");
        jwtService = new JwtService(jwtProperties);
        sessionRegistry = new WebSocketSessionRegistry();
        interceptor = new StompJwtChannelInterceptor(jwtService, sessionRegistry);
    }

    @Test
    @DisplayName("STOMP CONNECT authenticates valid APPLICATION JWT and rejects unauthenticated, expired, or onboarding tokens")
    void stompConnect_EnforcesJwtAuth() {
        UUID userId = UUID.randomUUID();
        String validToken = jwtService.generateAccessToken(userId);
        String onboardingToken = jwtService.generateOnboardingToken(userId);
        String expiredToken = jwtService.generateAccessToken(
                userId, Instant.now().minusSeconds(7200), Instant.now().minusSeconds(3600));

        // Valid CONNECT
        Message<?> validConnect = stompMessage(StompCommand.CONNECT, "sess-1", null, "Bearer " + validToken);
        Message<?> result = interceptor.preSend(validConnect, dummyChannel);
        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertThat(resultAccessor.getUser()).isNotNull();
        assertThat(((org.springframework.security.core.Authentication) resultAccessor.getUser()).getPrincipal())
                .isEqualTo(new UserPrincipal(userId));
        assertThat(sessionRegistry.hasActiveSession(userId)).isTrue();

        // Missing token
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.CONNECT, "sess-2", null, null), dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);

        // Expired token
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.CONNECT, "sess-3", null, "Bearer " + expiredToken), dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);

        // Onboarding token
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.CONNECT, "sess-4", null, "Bearer " + onboardingToken), dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("STOMP SUBSCRIBE allows only /user/queue/friends and blocks other destinations or client SEND")
    void stompSubscribeAndSend_EnforceDestinationRules() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId);

        Message<?> allowedSub = stompMessageWithUser(StompCommand.SUBSCRIBE, "/user/queue/friends", principal);
        assertThat(interceptor.preSend(allowedSub, dummyChannel)).isNotNull();

        Message<?> otherUserSub = stompMessageWithUser(StompCommand.SUBSCRIBE, "/user/" + UUID.randomUUID() + "/queue/friends", principal);
        assertThatThrownBy(() -> interceptor.preSend(otherUserSub, dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);

        Message<?> topicSub = stompMessageWithUser(StompCommand.SUBSCRIBE, "/topic/friends", principal);
        assertThatThrownBy(() -> interceptor.preSend(topicSub, dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);

        Message<?> clientSend = stompMessageWithUser(StompCommand.SEND, "/app/friends/ping", principal);
        assertThatThrownBy(() -> interceptor.preSend(clientSend, dummyChannel))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("OutboxDispatcher delivers thin payload to recipient and retries with backoff on failure")
    void outboxDispatcher_DeliversAndRetries() {
        UUID recipientId = UUID.randomUUID();
        UUID friendshipId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        String payload = """
                {
                  "eventId": "%s",
                  "type": "FRIEND_REQUEST_RECEIVED",
                  "friendshipId": "%s",
                  "occurredAt": "2026-11-28T05:00:00Z",
                  "recipientIds": ["%s"]
                }
                """.formatted(eventId, friendshipId, recipientId);

        OutboxEvent row = new OutboxEvent("FRIENDSHIP", friendshipId.toString(), "FRIEND_REQUEST_RECEIVED", payload);
        List<OutboxEvent> store = new ArrayList<>(List.of(row));
        Map<UUID, List<FriendRealtimeEvent>> delivered = new HashMap<>();
        boolean[] failGateway = {false};

        OutboxEventRepository repoProxy = (OutboxEventRepository) Proxy.newProxyInstance(
                OutboxEventRepository.class.getClassLoader(),
                new Class<?>[]{OutboxEventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findPendingFriendEventsForDispatch" -> store.stream()
                            .filter(e -> "PENDING".equals(e.getStatus()))
                            .toList();
                    case "save" -> args[0];
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );

        NotificationGateway gateway = (userId, event) -> {
            if (failGateway[0]) {
                throw new RuntimeException("Simulated broker outage");
            }
            delivered.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);
        };

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        OutboxDispatcher dispatcher = new OutboxDispatcher(repoProxy, gateway, objectMapper, 3, 5);

        // 1. Failure triggers retry with backoff, leaving status PENDING
        failGateway[0] = true;
        dispatcher.dispatchPendingEvents();
        assertThat(row.getStatus()).isEqualTo("PENDING");
        assertThat(row.getRetryCount()).isEqualTo(1);
        assertThat(row.getNextAttemptAt()).isNotNull();
        assertThat(delivered).isEmpty();

        // 2. Recovery delivers thin event to recipient only and marks PROCESSED
        failGateway[0] = false;
        dispatcher.dispatchPendingEvents();
        assertThat(row.getStatus()).isEqualTo("PROCESSED");
        assertThat(row.getProcessedAt()).isNotNull();
        assertThat(delivered).containsOnlyKeys(recipientId);
        FriendRealtimeEvent sent = delivered.get(recipientId).get(0);
        assertThat(sent.eventId()).isEqualTo(eventId);
        assertThat(sent.type()).isEqualTo("FRIEND_REQUEST_RECEIVED");
        assertThat(sent.friendshipId()).isEqualTo(friendshipId);
        assertThat(sent.guestId()).isNull();
    }

    private Message<?> stompMessage(StompCommand command, String sessionId, String destination, String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId(sessionId);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        if (authHeader != null) {
            accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, authHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> stompMessageWithUser(StompCommand command, String destination, UserPrincipal principal) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId("sess-auth");
        accessor.setDestination(destination);
        accessor.setUser(principal);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
