package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.controller.FriendsController;
import com.expensio.backend.friends.domain.*;
import com.expensio.backend.friends.policy.DefaultSplitObligationPolicy;
import com.expensio.backend.friends.policy.ObligationDecision;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.repository.FriendAuditLogRepository;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.friends.service.FriendsCommandService;
import com.expensio.backend.friends.service.FriendsReadService;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
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

class FriendsCommandServiceAndControllerTest {

    private static final UUID USER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID USER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID USER_C = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID GUEST_1 = UUID.fromString("99999999-9999-9999-9999-999999999999");

    private final Map<UUID, User> users = new ConcurrentHashMap<>();
    private final Map<UUID, UserProfile> profiles = new ConcurrentHashMap<>();
    private final Map<UUID, Participant> participants = new ConcurrentHashMap<>();
    private final Map<UUID, Friendship> friendships = new ConcurrentHashMap<>();
    private final List<OutboxEvent> outboxEvents = new ArrayList<>();
    private final List<FriendAuditLog> auditLogs = new ArrayList<>();
    private final AtomicReference<UUID> activeCaller = new AtomicReference<>(USER_A);

    private ObligationDecision policyDecision = ObligationDecision.UNKNOWN;
    private FriendsProperties properties;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        users.clear();
        profiles.clear();
        participants.clear();
        friendships.clear();
        outboxEvents.clear();
        auditLogs.clear();
        activeCaller.set(USER_A);
        policyDecision = ObligationDecision.UNKNOWN;
        properties = new FriendsProperties();

        addUser(USER_A, "Alice", "alice");
        addUser(USER_B, "Bob", "bob");
        addUser(USER_C, "Charlie", "charlie");
        participants.put(GUEST_1, new Participant(GUEST_1, ParticipantKind.GUEST));

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        FriendsCommandService commandService = new FriendsCommandService(
                userRepositoryProxy(),
                userProfileRepositoryProxy(),
                participantRepositoryProxy(),
                friendshipRepositoryProxy(),
                auditLogRepositoryProxy(),
                outboxRepositoryProxy(),
                new SplitObligationPolicy() {
                    @Override
                    public ObligationDecision checkPair(UUID userA, UUID userB) {
                        return policyDecision;
                    }

                    @Override
                    public ObligationDecision checkGuest(UUID guestId) {
                        return policyDecision;
                    }
                },
                properties,
                objectMapper
        );

        FriendsReadService readService = new FriendsReadService(null, properties);
        FriendsController controller = new FriendsController(readService, commandService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
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

    private void addUser(UUID id, String name, String username) {
        User u = new User(null, username + "@example.com", name);
        u.setId(id);
        users.put(id, u);
        UserProfile p = new UserProfile(id);
        p.setUsername(username);
        p.setAvatarId("avatar_1");
        profiles.put(id, p);
        participants.put(id, new Participant(id, ParticipantKind.USER));
    }

    @Test
    @DisplayName("Send, accept, idempotent accept, and fail-closed vs clear remove lifecycle")
    void fullFriendRequestLifecycle() throws Exception {
        // 1. Send A -> B
        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_B + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.direction").value("OUTGOING"))
                .andExpect(jsonPath("$.participant.id").value(USER_B.toString()));

        UUID friendshipId = friendships.values().iterator().next().getId();
        assertThat(outboxEvents).hasSize(1);
        assertThat(outboxEvents.get(0).getEventType()).isEqualTo("FRIEND_REQUEST_RECEIVED");
        assertThat(outboxEvents.get(0).getPayload()).contains(USER_B.toString());
        assertThat(auditLogs).hasSize(1);

        // 2. Reverse request B -> A rejected with 409 RELATIONSHIP_EXISTS
        activeCaller.set(USER_B);
        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_A + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RELATIONSHIP_EXISTS"));

        // 3. Non-participant C guessing UUID gets 404
        activeCaller.set(USER_C);
        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/accept"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FRIENDSHIP_NOT_FOUND"));

        // 4. Requester A cannot accept their own outgoing request -> 403
        activeCaller.set(USER_A);
        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/accept"))
                .andExpect(status().isForbidden());

        // 5. Addressee B accepts -> 200 ACCEPTED
        activeCaller.set(USER_B);
        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.direction").value("NONE"));
        assertThat(outboxEvents).hasSize(2);
        assertThat(outboxEvents.get(1).getEventType()).isEqualTo("FRIEND_REQUEST_ACCEPTED");

        // 6. Idempotent accept as addressee -> 200 no-op, no extra outbox event
        mockMvc.perform(post("/api/v1/friends/" + friendshipId + "/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
        assertThat(outboxEvents).hasSize(2);

        // 7. Remove blocked when SplitObligationPolicy returns UNKNOWN (fail closed)
        mockMvc.perform(delete("/api/v1/friends/" + friendshipId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUTSTANDING_SPLIT_OBLIGATIONS"));

        // 8. Remove succeeds when CLEAR
        policyDecision = ObligationDecision.CLEAR;
        activeCaller.set(USER_A);
        mockMvc.perform(delete("/api/v1/friends/" + friendshipId))
                .andExpect(status().isNoContent());

        assertThat(friendships).isEmpty();
        assertThat(outboxEvents).hasSize(3);
        assertThat(outboxEvents.get(2).getEventType()).isEqualTo("FRIEND_REMOVED");
        assertThat(outboxEvents.get(2).getPayload()).contains(USER_B.toString());
    }

    @Test
    @DisplayName("Self-request and guest target are rejected")
    void sendRequest_RejectsSelfAndGuest() throws Exception {
        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_A + "\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("SELF_FRIEND_REQUEST"));

        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + GUEST_1 + "\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("GUEST_CANNOT_BE_REQUESTED"));
    }

    @Test
    @DisplayName("Cancel by requester and decline by addressee emit distinct events; accepting cancelled returns 409")
    void cancelAndDeclinePendingRequests() throws Exception {
        // A sends to B, then A cancels
        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_B + "\"}"))
                .andExpect(status().isCreated());
        UUID f1 = friendships.values().iterator().next().getId();

        mockMvc.perform(delete("/api/v1/friends/" + f1))
                .andExpect(status().isNoContent());
        assertThat(outboxEvents.get(outboxEvents.size() - 1).getEventType()).isEqualTo("FRIEND_REQUEST_CANCELLED");

        // Addressee B trying to accept cancelled request gets 409 REQUEST_NOT_PENDING
        activeCaller.set(USER_B);
        mockMvc.perform(post("/api/v1/friends/" + f1 + "/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REQUEST_NOT_PENDING"));

        // Non-participant C trying to accept that same cancelled UUID still gets 404
        activeCaller.set(USER_C);
        mockMvc.perform(post("/api/v1/friends/" + f1 + "/accept"))
                .andExpect(status().isNotFound());

        // A sends to C, then C declines
        activeCaller.set(USER_A);
        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_C + "\"}"))
                .andExpect(status().isCreated());
        UUID f2 = friendships.values().iterator().next().getId();

        activeCaller.set(USER_C);
        mockMvc.perform(delete("/api/v1/friends/" + f2))
                .andExpect(status().isNoContent());
        assertThat(outboxEvents.get(outboxEvents.size() - 1).getEventType()).isEqualTo("FRIEND_REQUEST_DECLINED");
    }

    @Test
    @DisplayName("Friend cap of 10 is enforced for both requester and addressee")
    void sendRequest_EnforcesFriendCap() throws Exception {
        properties.setFriendCap(2);
        // USER_A already has 2 relationships
        for (int i = 0; i < 2; i++) {
            UUID other = UUID.randomUUID();
            addUser(other, "Filler " + i, "filler_" + i);
            Friendship f = new Friendship(USER_A, other, FriendshipStatus.ACCEPTED);
            f.setId(UUID.randomUUID());
            friendships.put(f.getId(), f);
        }

        mockMvc.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addresseeId\":\"" + USER_B + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FRIEND_LIMIT_REACHED"));
    }

    @Test
    @DisplayName("DefaultSplitObligationPolicy fails closed with UNKNOWN by default and returns CLEAR when configured")
    void defaultSplitObligationPolicy_RespectsConfig() {
        FriendsProperties props = new FriendsProperties();
        DefaultSplitObligationPolicy policy = new DefaultSplitObligationPolicy(props);
        assertThat(policy.checkPair(USER_A, USER_B)).isEqualTo(ObligationDecision.UNKNOWN);
        assertThat(policy.checkGuest(GUEST_1)).isEqualTo(ObligationDecision.UNKNOWN);

        props.setSplitObligationStubDecision(ObligationDecision.CLEAR);
        assertThat(policy.checkPair(USER_A, USER_B)).isEqualTo(ObligationDecision.CLEAR);
    }

    private UserRepository userRepositoryProxy() {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate", "findById" -> Optional.ofNullable(users.get((UUID) args[0]));
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
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private ParticipantRepository participantRepositoryProxy() {
        return (ParticipantRepository) Proxy.newProxyInstance(
                ParticipantRepository.class.getClassLoader(),
                new Class<?>[]{ParticipantRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(participants.get((UUID) args[0]));
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private FriendshipRepository friendshipRepositoryProxy() {
        return (FriendshipRepository) Proxy.newProxyInstance(
                FriendshipRepository.class.getClassLoader(),
                new Class<?>[]{FriendshipRepository.class},
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
                                        && statuses.contains(f.getStatus()))
                                .count();
                    }
                    case "saveAndFlush", "save" -> {
                        Friendship f = (Friendship) args[0];
                        if (f.getId() == null) {
                            f.setId(UUID.randomUUID());
                        }
                        friendships.put(f.getId(), f);
                        yield f;
                    }
                    case "delete" -> {
                        Friendship f = (Friendship) args[0];
                        friendships.remove(f.getId());
                        yield null;
                    }
                    case "flush" -> null;
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private FriendAuditLogRepository auditLogRepositoryProxy() {
        return (FriendAuditLogRepository) Proxy.newProxyInstance(
                FriendAuditLogRepository.class.getClassLoader(),
                new Class<?>[]{FriendAuditLogRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        FriendAuditLog entry = (FriendAuditLog) args[0];
                        auditLogs.add(entry);
                        yield entry;
                    }
                    case "findByTargetTypeAndTargetIdOrderByCreatedAtDesc" -> {
                        String type = (String) args[0];
                        UUID targetId = (UUID) args[1];
                        yield auditLogs.stream()
                                .filter(l -> l.getTargetType().equals(type) && l.getTargetId().equals(targetId))
                                .toList();
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private OutboxEventRepository outboxRepositoryProxy() {
        return (OutboxEventRepository) Proxy.newProxyInstance(
                OutboxEventRepository.class.getClassLoader(),
                new Class<?>[]{OutboxEventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        OutboxEvent event = (OutboxEvent) args[0];
                        outboxEvents.add(event);
                        yield event;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
