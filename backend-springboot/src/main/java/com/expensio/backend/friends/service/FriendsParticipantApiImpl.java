package com.expensio.backend.friends.service;

import com.expensio.backend.friends.api.FriendsParticipantApi;
import com.expensio.backend.friends.api.ParticipantSnapshot;
import com.expensio.backend.friends.api.ParticipantView;
import com.expensio.backend.friends.domain.FriendshipStatus;
import com.expensio.backend.friends.domain.GuestProfile;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import com.expensio.backend.friends.repository.FriendshipRepository;
import com.expensio.backend.friends.repository.GuestRepository;
import com.expensio.backend.profile.UserProfile;
import com.expensio.backend.profile.UserProfileRepository;
import com.expensio.backend.user.User;
import com.expensio.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class FriendsParticipantApiImpl implements FriendsParticipantApi {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final GuestRepository guestRepository;
    private final FriendshipRepository friendshipRepository;

    public FriendsParticipantApiImpl(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            GuestRepository guestRepository,
            FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.guestRepository = guestRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Override
    public Map<UUID, ParticipantView> resolveParticipants(Set<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }

        Map<UUID, ParticipantView> result = new LinkedHashMap<>();

        List<User> users = userRepository.findAllById(ids);
        if (!users.isEmpty()) {
            Map<UUID, UserProfile> profilesByUserId = new HashMap<>();
            userProfileRepository.findAllById(users.stream().map(User::getId).toList())
                    .forEach(p -> profilesByUserId.put(p.getUserId(), p));

            for (User user : users) {
                UserProfile profile = profilesByUserId.get(user.getId());
                result.put(user.getId(), new ParticipantView(
                        user.getId(),
                        user.getName(),
                        profile != null ? profile.getUsername() : null,
                        profile != null ? profile.getAvatarId() : null,
                        false,
                        false
                ));
            }
        }

        List<GuestProfile> guests = guestRepository.findAllById(ids);
        for (GuestProfile guest : guests) {
            result.put(guest.getId(), new ParticipantView(
                    guest.getId(),
                    guest.getName(),
                    guest.getUsername(),
                    guest.getAvatarId(),
                    true,
                    guest.isRetired()
            ));
        }

        return Collections.unmodifiableMap(result);
    }

    @Override
    public boolean areFriends(UUID userA, UUID userB) {
        if (userA == null || userB == null || userA.equals(userB)) {
            return false;
        }
        return friendshipRepository.findBetween(userA, userB)
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);
    }

    @Override
    public boolean isGuestOwnedBy(UUID guestId, UUID userId) {
        if (guestId == null || userId == null) {
            return false;
        }
        return guestRepository.findByIdAndOwnerUserId(guestId, userId)
                .map(guest -> !guest.isRetired())
                .orElse(false);
    }

    @Override
    public ParticipantSnapshot getParticipantSnapshot(UUID participantId) {
        if (participantId == null) {
            throw new FriendApiException(FriendErrorCode.NOT_FOUND, "Participant not found");
        }

        Optional<User> userOpt = userRepository.findById(participantId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
            return new ParticipantSnapshot(
                    user.getId(),
                    user.getName(),
                    profile != null ? profile.getUsername() : null,
                    profile != null ? profile.getAvatarId() : null,
                    false,
                    false
            );
        }

        return guestRepository.findById(participantId)
                .map(guest -> new ParticipantSnapshot(
                        guest.getId(),
                        guest.getName(),
                        guest.getUsername(),
                        guest.getAvatarId(),
                        true,
                        guest.isRetired()
                ))
                .orElseThrow(() -> new FriendApiException(FriendErrorCode.NOT_FOUND, "Participant not found"));
    }
}
