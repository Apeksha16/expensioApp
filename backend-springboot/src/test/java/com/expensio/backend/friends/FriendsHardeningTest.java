package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.controller.FriendsController;
import com.expensio.backend.friends.controller.GuestController;
import com.expensio.backend.friends.domain.*;
import com.expensio.backend.friends.policy.ObligationDecision;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.realtime.StompJwtChannelInterceptor;
import com.expensio.backend.friends.realtime.WebSocketSessionRegistry;
import com.expensio.backend.friends.repository.*;
import com.expensio.backend.friends.service.FriendsCommandService;
import com.expensio.backend.friends.service.FriendsReadService;
import com.expensio.backend.friends.service.GuestService;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.security.JwtProperties;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.security.RequestIdFilter;
import com.expensio.backend.security.UserPrincipal;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FriendsHardeningTest {

    private static final UUID USER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID USER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID USER_C = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private final Map<UUID, User> users = new ConcurrentHashMap<>();
    private final Map<UUID, UserProfile> profiles = new ConcurrentHashMap<>();
    private final Map<UUID, Participant> participants = new ConcurrentHashMap<>();
    private final Map<UUID, Friendship> friendships = new ConcurrentHashMap<>();
    private final Map<UUID, GuestProfile> guests = new ConcurrentHashMap<>();
    private final List<FriendAuditLog> auditLogs = new ArrayList<>();
    private final AtomicReference<UUID> activeCaller = new AtomicReference<>(USER_A);

    private FriendsProperties properties;
    private FriendsRateLimiter rateLimiter;
    private JwtService jwtService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        users.clear();
        profiles.clear();
        participants.clear();
        friendships.clear();
        guests.clear();
        auditLogs.clear();
        activeCaller.set(USER_A);

        properties = new FriendsProperties();
        properties.getRateLimit().setSearchPerMinute(2);
        properties.getRateLimit().setFriendRequestsPerMinute(2);
        properties.getRateLimit().setGuestCreatePerMinute(2);
        properties.getRateLimit().setGuestAvatarPerMinute(2);
        properties.getRateLimit().setWsConnectPerMinute(2);

        rateLimiter = new FriendsRateLimiter();

        addUser(USER_A, "Alice", "alice");
        addUser(USER_B, "Bob", "bob");
        addUser(USER_C, "Charlie", "charlie");

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        SplitObligationPolicy clearPolicy = new SplitObligationPolicy() {
            @Override
            public ObligationDecision checkPair(UUID userA, UUID userB) {
                return ObligationDecision.CLEAR;
            }

            @Override
            public ObligationDecision checkGuest(UUID guestId) {
                return ObligationDecision.CLEAR;
            }
        };

        FriendReadRepository readRepo = new FriendReadRepository() {
            @Override
            public List<com.expensio.backend.friends.dto.FriendItemDto> findUserFriendshipsPage(UUID callerId, Instant cursorCreatedAt, UUID cursorId, int limitPlusOne) {
                return List.of();
            }

            @Override
            public List<com.expensio.backend.friends.dto.GuestSummaryDto> findActiveGuests(UUID callerId) {
                return List.of();
            }

            @Override
            public RelationshipCounts countRelationships(UUID callerId) {
                return new RelationshipCounts(0, 0, 0, 0);
            }

            @Override
            public List<SearchCandidateRow> searchEligibleUsers(UUID callerId, String escapedLikePattern, int friendCap, boolean guestsCountTowardFriendCap, String cursorSortKey, UUID cursorId, int limitPlusOne) {
                return List.of();
            }
        };

        FriendsReadService readService = new FriendsReadService(readRepo, properties, rateLimiter);
        FriendsCommandService commandService = new FriendsCommandService(
                userRepositoryProxy(), userProfileRepositoryProxy(), participantRepositoryProxy(),
                friendshipRepositoryProxy(), auditLogRepositoryProxy(), outboxRepositoryProxy(),
                clearPolicy, properties, objectMapper, rateLimiter
        );
        GuestService guestService = new GuestService(
                userRepositoryProxy(), participantRepositoryProxy(), guestRepositoryProxy(),
                friendshipRepositoryProxy(), auditLogRepositoryProxy(), outboxRepositoryProxy(),
                clearPolicy, properties, objectMapper, rateLimiter
        );

        JwtProperties jwtProps = new JwtProperties();
        jwtProps.setSecret("test_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256_tests!");
        jwtProps.setAccessTokenExpirationMs(3600000L);
        jwtProps.setRefreshTokenExpirationMs(86400000L);
        jwtProps.setIssuer("expensio-api-test");
        jwtService = new JwtService(jwtProps);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new FriendsController(readService, commandService), new GuestController(guestService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                                && parameter.getParameterType().equals(UserPrincipal.class);
                    }

                    @Override
                    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                        return new UserPrincipal(activeCaller.get());
                    }
                })
                .addFilters(new RequestIdFilter())
                .build();
    }

    private void addUser(UUID id, String name, String username) {
        User u = new User(null, username + "@example.com", name);
        u.setId(id);
        users.put(id, u);
        UserProfile p = new UserProfile(id);
        p.setUsername(username);
        profiles.put(id, p);
        participants.put(id, new Participant(id, ParticipantKind.USER));
    }

    @Test
    @DisplayName("Rate limits return 429 RATE_LIMITED on search, friend requests, guest creation, avatar change, and WS connect")
    void rateLimits_Return429() throws Exception {
        // Search (limit 2)
        mockMvc.perform(get("/api/v1/friends/search").param("q", "al")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/friends/search").param("q", "bo")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/friends/search").param("q", "ch"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));

        // Friend requests (limit 2)
        mockMvc.perform(post("/api/v1/friends/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_B + "\"}")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/friends/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_C + "\"}")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/friends/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));

        // Guest creation (limit 2)
        mockMvc.perform(post("/api/v1/friends/guests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"G1\",\"username\":\"g_1\"}")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/friends/guests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"G2\",\"username\":\"g_2\"}")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/friends/guests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"G3\",\"username\":\"g_3\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));

        // Guest avatar change (limit 2)
        UUID guestId = guests.keySet().iterator().next();
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_2\"}")).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_3\"}")).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_4\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));

        // WebSocket connect (limit 2)
        StompJwtChannelInterceptor wsInterceptor = new StompJwtChannelInterceptor(
                jwtService, new WebSocketSessionRegistry(), rateLimiter, properties);
        String token = jwtService.generateAccessToken(USER_A);
        wsInterceptor.preSend(connectMsg("s1", token), (m, t) -> true);
        wsInterceptor.preSend(connectMsg("s2", token), (m, t) -> true);
        assertThatThrownBy(() -> wsInterceptor.preSend(connectMsg("s3", token), (m, t) -> true))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("Input validation rejects control characters in guest names and invalid usernames")
    void inputValidation_RejectsInvalidNamesAndUsernames() throws Exception {
        mockMvc.perform(post("/api/v1/friends/guests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Bad\\u0000Name\",\"username\":\"valid_name\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/v1/friends/guests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Good Name\",\"username\":\"bad name!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("All friend and guest mutations produce friend_audit_log rows")
    void auditCoverage_AllMutationsProduceAuditLogs() throws Exception {
        properties.getRateLimit().setFriendRequestsPerMinute(50);
        properties.getRateLimit().setGuestCreatePerMinute(50);
        properties.getRateLimit().setGuestAvatarPerMinute(50);

        // 1. Send, Accept, Remove
        mockMvc.perform(post("/api/v1/friends/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_B + "\"}")).andExpect(status().isCreated());
        UUID f1 = friendships.keySet().iterator().next();

        activeCaller.set(USER_B);
        mockMvc.perform(post("/api/v1/friends/" + f1 + "/accept")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/friends/" + f1)).andExpect(status().isNoContent());

        // 2. Guest create, edit name, edit avatar, retire
        activeCaller.set(USER_A);
        mockMvc.perform(post("/api/v1/friends/guests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Audit Guest\",\"username\":\"audit_guest\"}")).andExpect(status().isCreated());
        UUID g1 = guests.keySet().iterator().next();
        mockMvc.perform(patch("/api/v1/friends/guests/" + g1).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Renamed\"}")).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/friends/guests/" + g1 + "/avatar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_2\"}")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/friends/guests/" + g1)).andExpect(status().isNoContent());

        List<String> actions = auditLogs.stream().map(FriendAuditLog::getAction).toList();
        assertThat(actions).containsExactly(
                "FRIEND_REQUEST_SENT",
                "FRIEND_REQUEST_ACCEPTED",
                "FRIEND_REMOVED",
                "GUEST_CREATED",
                "GUEST_UPDATED",
                "GUEST_AVATAR_UPDATED",
                "GUEST_RETIRED"
        );
    }

    private Message<?> connectMsg(String sessionId, String token) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionId(sessionId);
        accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private UserRepository userRepositoryProxy() {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate", "findById" -> Optional.ofNullable(users.get((UUID) args[0]));
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private UserProfileRepository userProfileRepositoryProxy() {
        return (UserProfileRepository) Proxy.newProxyInstance(
                UserProfileRepository.class.getClassLoader(), new Class<?>[]{UserProfileRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(profiles.get((UUID) args[0]));
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private ParticipantRepository participantRepositoryProxy() {
        return (ParticipantRepository) Proxy.newProxyInstance(
                ParticipantRepository.class.getClassLoader(), new Class<?>[]{ParticipantRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(participants.get((UUID) args[0]));
                    case "saveAndFlush", "save" -> {
                        Participant p = (Participant) args[0];
                        participants.put(p.getId(), p);
                        yield p;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private FriendshipRepository friendshipRepositoryProxy() {
        return (FriendshipRepository) Proxy.newProxyInstance(
                FriendshipRepository.class.getClassLoader(), new Class<?>[]{FriendshipRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate", "findById" -> Optional.ofNullable(friendships.get((UUID) args[0]));
                    case "findBetween" -> {
                        UUID a = (UUID) args[0];
                        UUID b = (UUID) args[1];
                        yield friendships.values().stream()
                                .filter(f -> (f.getRequesterId().equals(a) && f.getAddresseeId().equals(b))
                                        || (f.getRequesterId().equals(b) && f.getAddresseeId().equals(a)))
                                .findFirst();
                    }
                    case "countByParticipantAndStatusIn" -> {
                        UUID u = (UUID) args[0];
                        @SuppressWarnings("unchecked")
                        List<FriendshipStatus> statuses = (List<FriendshipStatus>) args[1];
                        yield friendships.values().stream()
                                .filter(f -> (f.getRequesterId().equals(u) || f.getAddresseeId().equals(u))
                                        && statuses.contains(f.getStatus())).count();
                    }
                    case "saveAndFlush", "save" -> {
                        Friendship f = (Friendship) args[0];
                        if (f.getId() == null) f.setId(UUID.randomUUID());
                        friendships.put(f.getId(), f);
                        yield f;
                    }
                    case "delete" -> {
                        friendships.remove(((Friendship) args[0]).getId());
                        yield null;
                    }
                    case "flush" -> null;
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private GuestRepository guestRepositoryProxy() {
        return (GuestRepository) Proxy.newProxyInstance(
                GuestRepository.class.getClassLoader(), new Class<?>[]{GuestRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate", "findById" -> Optional.ofNullable(guests.get((UUID) args[0]));
                    case "countByOwnerUserIdAndRetiredAtIsNull" -> {
                        UUID owner = (UUID) args[0];
                        yield guests.values().stream().filter(g -> g.getOwnerUserId().equals(owner) && !g.isRetired()).count();
                    }
                    case "existsByOwnerUserIdAndNormalizedUsername" -> {
                        UUID owner = (UUID) args[0];
                        String username = (String) args[1];
                        yield guests.values().stream().anyMatch(g -> g.getOwnerUserId().equals(owner) && g.getUsername().equalsIgnoreCase(username));
                    }
                    case "saveAndFlush", "save" -> {
                        GuestProfile g = (GuestProfile) args[0];
                        guests.put(g.getId(), g);
                        yield g;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private FriendAuditLogRepository auditLogRepositoryProxy() {
        return (FriendAuditLogRepository) Proxy.newProxyInstance(
                FriendAuditLogRepository.class.getClassLoader(), new Class<?>[]{FriendAuditLogRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        FriendAuditLog entry = (FriendAuditLog) args[0];
                        auditLogs.add(entry);
                        yield entry;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private OutboxEventRepository outboxRepositoryProxy() {
        return (OutboxEventRepository) Proxy.newProxyInstance(
                OutboxEventRepository.class.getClassLoader(), new Class<?>[]{OutboxEventRepository.class},
                (proxy, method, args) -> args[0]);
    }
}
