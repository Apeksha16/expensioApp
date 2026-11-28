package com.expensio.backend.friends;

import com.expensio.backend.friends.config.FriendsProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FriendsPropertiesTest {

    @Test
    void defaultsMatchPhase0Spec() {
        FriendsProperties props = new FriendsProperties();

        assertThat(props.getFriendCap()).isEqualTo(10);
        assertThat(props.getGuestCap()).isEqualTo(5);
        assertThat(props.isGuestsCountTowardFriendCap()).isTrue();
        assertThat(props.getSearch().getMinQueryLength()).isEqualTo(2);
        assertThat(props.getSearch().getMaxQueryLength()).isEqualTo(50);
        assertThat(props.getSearch().getDefaultLimit()).isEqualTo(50);
        assertThat(props.getSearch().getMaxLimit()).isEqualTo(100);
        assertThat(props.getAvatarAllowlist()).isNotEmpty();
    }
}
