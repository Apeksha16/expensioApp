package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.controller.GuestController;
import com.expensio.backend.friends.domain.*;
import com.expensio.backend.friends.policy.ObligationDecision;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.repository.FriendAuditLogRepository;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.friends.repository.ParticipantRepository;
import com.expensio.backend.friends.service.GuestService;
import com.expensio.backend.outbox.OutboxEvent;
import com.expensio.backend.outbox.OutboxEventRepository;
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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GuestServiceAndControllerTest {

    private static final UUID OWNER_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID OTHER_USER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private final Map<UUID, User> users = new ConcurrentHashMap<>();
    private final Map<UUID, Participant> participants = new ConcurrentHashMap<>();
    private final Map<UUID, GuestProfile> guests = new ConcurrentHashMap<>();
    private final Map<UUID, Friendship> friendships = new ConcurrentHashMap<>();
    private final List<OutboxEvent> outboxEvents = new ArrayList<>();
    private final List<FriendAuditLog> auditLogs = new ArrayList<>();
    private final AtomicReference<UUID> activeCaller = new AtomicReference<>(OWNER_ID);

    private ObligationDecision policyDecision = ObligationDecision.UNKNOWN;
    private FriendsProperties properties;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        users.clear();
        participants.clear();
        guests.clear();
        friendships.clear();
        outboxEvents.clear();
        auditLogs.clear();
        activeCaller.set(OWNER_ID);
        policyDecision = ObligationDecision.UNKNOWN;
        properties = new FriendsProperties();

        User owner = new User(null, "owner@example.com", "Owner");
        owner.setId(OWNER_ID);
        users.put(OWNER_ID, owner);

        User other = new User(null, "other@example.com", "Other");
        other.setId(OTHER_USER_ID);
        users.put(OTHER_USER_ID, other);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GuestService service = new GuestService(
                userRepositoryProxy(),
                participantRepositoryProxy(),
                guestRepositoryProxy(),
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

        mockMvc = MockMvcBuilders
                .standaloneSetup(new GuestController(service))
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
    @DisplayName("Guest cap of 5 and case-insensitive username uniqueness are enforced")
    void createGuest_EnforcesCapAndUsernameUniqueness() throws Exception {
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/v1/friends/guests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Guest " + i + "\",\"username\":\"Guest_" + i + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.guest.isGuest").value(true))
                    .andExpect(jsonPath("$.guest.username").value("guest_" + i))
                    .andExpect(jsonPath("$.friendshipId").isNotEmpty());
        }

        // 6th guest fails
        mockMvc.perform(post("/api/v1/friends/guests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Guest 6\",\"username\":\"guest_6\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("GUEST_LIMIT_REACHED"));

        // List guests returns count=5, limit=5
        mockMvc.perform(get("/api/v1/friends/guests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guests", hasSize(5)))
                .andExpect(jsonPath("$.count").value(5))
                .andExpect(jsonPath("$.limit").value(5));

        // Duplicate username with different casing (after freeing cap or under limit)
        properties.setGuestCap(10);
        mockMvc.perform(post("/api/v1/friends/guests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dup\",\"username\":\"GUEST_1\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USERNAME_TAKEN"));
    }

    @Test
    @DisplayName("Guest edit, avatar allowlist, non-owner rejection, and fail-closed retire")
    void guestEditAvatarAndRetireLifecycle() throws Exception {
        mockMvc.perform(post("/api/v1/friends/guests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Trip Guest\",\"username\":\"trip_guest\"}"))
                .andExpect(status().isCreated());

        UUID guestId = guests.keySet().iterator().next();

        // Invalid avatar rejected
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"hacked_avatar\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_AVATAR"));

        // Valid avatar succeeds
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_3\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarId").value("avatar_3"));

        // Non-owner edit, avatar, and retire all fail
        activeCaller.set(OTHER_USER_ID);
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hijack\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("GUEST_NOT_OWNED"));

        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId + "/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\":\"avatar_2\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/friends/guests/" + guestId))
                .andExpect(status().isNotFound());

        // Owner edit succeeds
        activeCaller.set(OWNER_ID);
        mockMvc.perform(patch("/api/v1/friends/guests/" + guestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated Guest\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Guest"));

        // Retire blocked when UNKNOWN or OUTSTANDING
        policyDecision = ObligationDecision.UNKNOWN;
        mockMvc.perform(delete("/api/v1/friends/guests/" + guestId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUTSTANDING_SPLIT_OBLIGATIONS"));

        policyDecision = ObligationDecision.OUTSTANDING;
        mockMvc.perform(delete("/api/v1/friends/guests/" + guestId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUTSTANDING_SPLIT_OBLIGATIONS"));

        // Retire succeeds when CLEAR, removes friendship, preserves retired guest row
        policyDecision = ObligationDecision.CLEAR;
        mockMvc.perform(delete("/api/v1/friends/guests/" + guestId))
                .andExpect(status().isNoContent());

        assertThat(guests.get(guestId).isRetired()).isTrue();
        assertThat(friendships).isEmpty();
        assertThat(outboxEvents.get(outboxEvents.size() - 1).getEventType()).isEqualTo("GUEST_RETIRED");
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

    private ParticipantRepository participantRepositoryProxy() {
        return (ParticipantRepository) Proxy.newProxyInstance(
                ParticipantRepository.class.getClassLoader(),
                new Class<?>[]{ParticipantRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "saveAndFlush", "save" -> {
                        Participant p = (Participant) args[0];
                        participants.put(p.getId(), p);
                        yield p;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private GuestRepository guestRepositoryProxy() {
        return (GuestRepository) Proxy.newProxyInstance(
                GuestRepository.class.getClassLoader(),
                new Class<?>[]{GuestRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdForUpdate", "findById" -> Optional.ofNullable(guests.get((UUID) args[0]));
                    case "countByOwnerUserIdAndRetiredAtIsNull" -> {
                        UUID owner = (UUID) args[0];
                        yield guests.values().stream()
                                .filter(g -> g.getOwnerUserId().equals(owner) && !g.isRetired())
                                .count();
                    }
                    case "findByOwnerUserIdAndRetiredAtIsNullOrderByCreatedAtAscIdAsc" -> {
                        UUID owner = (UUID) args[0];
                        yield guests.values().stream()
                                .filter(g -> g.getOwnerUserId().equals(owner) && !g.isRetired())
                                .toList();
                    }
                    case "existsByOwnerUserIdAndNormalizedUsername" -> {
                        UUID owner = (UUID) args[0];
                        String username = (String) args[1];
                        yield guests.values().stream()
                                .anyMatch(g -> g.getOwnerUserId().equals(owner) && g.getUsername().equalsIgnoreCase(username));
                    }
                    case "saveAndFlush", "save" -> {
                        GuestProfile g = (GuestProfile) args[0];
                        guests.put(g.getId(), g);
                        yield g;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private FriendshipRepository friendshipRepositoryProxy() {
        return (FriendshipRepository) Proxy.newProxyInstance(
                FriendshipRepository.class.getClassLoader(),
                new Class<?>[]{FriendshipRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "countByParticipantAndStatusIn" -> {
                        UUID u = (UUID) args[0];
                        @SuppressWarnings("unchecked")
                        List<FriendshipStatus> statuses = (List<FriendshipStatus>) args[1];
                        yield friendships.values().stream()
                                .filter(f -> (f.getRequesterId().equals(u) || f.getAddresseeId().equals(u))
                                        && statuses.contains(f.getStatus()))
                                .count();
                    }
                    case "findBetween" -> {
                        UUID a = (UUID) args[0];
                        UUID b = (UUID) args[1];
                        yield friendships.values().stream()
                                .filter(f -> (f.getRequesterId().equals(a) && f.getAddresseeId().equals(b))
                                        || (f.getRequesterId().equals(b) && f.getAddresseeId().equals(a)))
                                .findFirst();
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
                        FriendAuditLog log = (FriendAuditLog) args[0];
                        auditLogs.add(log);
                        yield log;
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
