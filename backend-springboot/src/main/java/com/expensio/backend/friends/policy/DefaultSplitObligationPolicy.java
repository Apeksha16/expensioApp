package com.expensio.backend.friends.policy;

import com.expensio.backend.friends.config.FriendsProperties;

import java.util.UUID;

/**
 * Default fail-closed SplitObligationPolicy stub until the Splits module provides a real bean.
 * Production default is UNKNOWN (blocks removals). Dev/test profiles may configure CLEAR.
 */
public class DefaultSplitObligationPolicy implements SplitObligationPolicy {

    private final FriendsProperties properties;

    public DefaultSplitObligationPolicy(FriendsProperties properties) {
        this.properties = properties;
    }

    @Override
    public ObligationDecision checkPair(UUID userA, UUID userB) {
        return properties.getSplitObligationStubDecision();
    }

    @Override
    public ObligationDecision checkGuest(UUID guestId) {
        return properties.getSplitObligationStubDecision();
    }
}
