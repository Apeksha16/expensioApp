package com.expensio.backend.friends.api;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface FriendsParticipantApi {

    Map<UUID, ParticipantView> resolveParticipants(Set<UUID> ids);

    boolean areFriends(UUID userA, UUID userB);

    boolean isGuestOwnedBy(UUID guestId, UUID userId);

    ParticipantSnapshot getParticipantSnapshot(UUID participantId);
}
