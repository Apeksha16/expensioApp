package com.expensio.backend.friends.policy;

import java.util.UUID;

public interface SplitObligationPolicy {

    ObligationDecision checkPair(UUID userA, UUID userB);

    ObligationDecision checkGuest(UUID guestId);
}
