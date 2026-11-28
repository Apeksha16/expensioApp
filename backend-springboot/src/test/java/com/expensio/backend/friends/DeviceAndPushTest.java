package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.push.*;
import com.expensio.backend.friends.realtime.FriendRealtimeEvent;
import com.expensio.backend.friends.realtime.OutboxDispatcher;
import com.expensio.backend.friends.realtime.WebSocketSessionRegistry;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.security.RequestIdFilter;
import com.expensio.backend.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DeviceAndPushTest {

    private static final UUID USER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID USER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private final Map<String, DeviceToken> tokens = new ConcurrentHashMap<>();
    private final AtomicReference<UUID> activeCaller = new AtomicReference<>(USER_A);

    private MockMvc mockMvc;
    private DeviceTokenRepository tokenRepo;

    @BeforeEach
    void setUp() {
        tokens.clear();
        activeCaller.set(USER_A);
        tokenRepo = deviceTokenRepositoryProxy();
        DeviceTokenService service = new DeviceTokenService(tokenRepo, new FriendsRateLimiter());

        mockMvc = MockMvcBuilders
                .standaloneSetup(new DeviceController(service))
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
                        return new UserPrincipal(activeCaller.get());
                    }
                })
                .addFilters(new RequestIdFilter())
                .build();
    }

    @Test
    @DisplayName("User can register and remove only their own device tokens; registration is rate-limited")
    void registerAndRemoveOwnDeviceTokens() throws Exception {
        mockMvc.perform(post("/api/v1/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"fcm-token-a\",\"platform\":\"ANDROID\"}"))
                .andExpect(status().isNoContent());

        assertThat(tokens).containsKey("fcm-token-a");
        assertThat(tokens.get("fcm-token-a").getUserId()).isEqualTo(USER_A);

        // User B cannot delete User A's token
        activeCaller.set(USER_B);
        mockMvc.perform(delete("/api/v1/devices/fcm-token-a"))
                .andExpect(status().isNoContent());
        assertThat(tokens).containsKey("fcm-token-a");

        // User A can delete their own token
        activeCaller.set(USER_A);
        mockMvc.perform(delete("/api/v1/devices/fcm-token-a"))
                .andExpect(status().isNoContent());
        assertThat(tokens).doesNotContainKey("fcm-token-a");

        // Rate limit after 10 registrations per minute (1 already used above -> 9 more succeed, 11th returns 429)
        for (int i = 0; i < 9; i++) {
            mockMvc.perform(post("/api/v1/devices")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"token\":\"tok-" + i + "\",\"platform\":\"IOS\"}"))
                    .andExpect(status().isNoContent());
        }
        mockMvc.perform(post("/api/v1/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"tok-overflow\",\"platform\":\"IOS\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    @DisplayName("Push is skipped when WebSocket session is active, sent when offline, and invalid tokens are pruned")
    void pushDeliveryAndInvalidTokenPruning() {
        tokens.put("valid-tok", new DeviceToken(USER_A, "valid-tok", DevicePlatform.IOS));
        tokens.put("dead-tok", new DeviceToken(USER_A, "dead-tok", DevicePlatform.ANDROID));

        WebSocketSessionRegistry sessionRegistry = new WebSocketSessionRegistry();
        List<String> sentPushTokens = new ArrayList<>();

        PushGateway pushGateway = (deviceToken, event) -> {
            if ("dead-tok".equals(deviceToken.getToken())) {
                return PushResult.INVALID_TOKEN;
            }
            sentPushTokens.add(deviceToken.getToken());
            return PushResult.SENT;
        };

        String payload = """
                {
                  "eventId": "%s",
                  "type": "FRIEND_REQUEST_RECEIVED",
                  "friendshipId": "%s",
                  "occurredAt": "2026-11-28T05:00:00Z",
                  "recipientIds": ["%s"]
                }
                """.formatted(UUID.randomUUID(), UUID.randomUUID(), USER_A);

        OutboxEvent event1 = new OutboxEvent("FRIENDSHIP", UUID.randomUUID().toString(), "FRIEND_REQUEST_RECEIVED", payload);
        OutboxEvent event2 = new OutboxEvent("FRIENDSHIP", UUID.randomUUID().toString(), "FRIEND_REQUEST_RECEIVED", payload);
        List<OutboxEvent> store = new ArrayList<>(List.of(event1));

        OutboxEventRepository outboxRepo = (OutboxEventRepository) Proxy.newProxyInstance(
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

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        OutboxDispatcher dispatcher = new OutboxDispatcher(
                outboxRepo,
                (u, e) -> {},
                mapper,
                3,
                5,
                sessionRegistry,
                tokenRepo,
                pushGateway
        );

        // 1. Live WebSocket session -> no duplicate push sent
        sessionRegistry.bindAuthenticatedUser("ws-1", USER_A, Instant.now().plusSeconds(300));
        dispatcher.dispatchPendingEvents();
        assertThat(sentPushTokens).isEmpty();
        assertThat(tokens).containsKey("dead-tok");

        // 2. Offline -> push sent to valid token and invalid token pruned
        sessionRegistry.removeSession("ws-1");
        store.add(event2);
        dispatcher.dispatchPendingEvents();
        assertThat(sentPushTokens).containsExactly("valid-tok");
        assertThat(tokens).doesNotContainKey("dead-tok");
    }

    private DeviceTokenRepository deviceTokenRepositoryProxy() {
        return (DeviceTokenRepository) Proxy.newProxyInstance(
                DeviceTokenRepository.class.getClassLoader(),
                new Class<?>[]{DeviceTokenRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByToken" -> Optional.ofNullable(tokens.get((String) args[0]));
                    case "findByUserIdAndPushEnabledTrue" -> {
                        UUID u = (UUID) args[0];
                        yield tokens.values().stream()
                                .filter(t -> t.getUserId().equals(u) && t.isPushEnabled())
                                .toList();
                    }
                    case "save" -> {
                        DeviceToken dt = (DeviceToken) args[0];
                        tokens.put(dt.getToken(), dt);
                        yield dt;
                    }
                    case "delete" -> {
                        DeviceToken dt = (DeviceToken) args[0];
                        tokens.remove(dt.getToken());
                        yield null;
                    }
                    case "deleteByUserIdAndToken" -> {
                        UUID u = (UUID) args[0];
                        String tok = (String) args[1];
                        DeviceToken existing = tokens.get(tok);
                        if (existing != null && existing.getUserId().equals(u)) {
                            tokens.remove(tok);
                        }
                        yield null;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
