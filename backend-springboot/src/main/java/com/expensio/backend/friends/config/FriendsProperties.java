package com.expensio.backend.friends.config;

import com.expensio.backend.friends.policy.ObligationDecision;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.friends")
public class FriendsProperties {

    private int friendCap = 10;
    private int guestCap = 5;
    private boolean guestsCountTowardFriendCap = true;
    private ObligationDecision splitObligationStubDecision = ObligationDecision.UNKNOWN;
    private Search search = new Search();
    private RateLimit rateLimit = new RateLimit();
    private List<String> avatarAllowlist = new ArrayList<>(List.of(
            "avatar_1", "avatar_2", "avatar_3", "avatar_4",
            "avatar_5", "avatar_6", "avatar_7", "avatar_8",
            "avatar_9", "avatar_10", "avatar_11", "avatar_12"
    ));

    public int getFriendCap() {
        return friendCap;
    }

    public void setFriendCap(int friendCap) {
        this.friendCap = friendCap;
    }

    public int getGuestCap() {
        return guestCap;
    }

    public void setGuestCap(int guestCap) {
        this.guestCap = guestCap;
    }

    public boolean isGuestsCountTowardFriendCap() {
        return guestsCountTowardFriendCap;
    }

    public void setGuestsCountTowardFriendCap(boolean guestsCountTowardFriendCap) {
        this.guestsCountTowardFriendCap = guestsCountTowardFriendCap;
    }

    public ObligationDecision getSplitObligationStubDecision() {
        return splitObligationStubDecision;
    }

    public void setSplitObligationStubDecision(ObligationDecision splitObligationStubDecision) {
        this.splitObligationStubDecision = splitObligationStubDecision != null
                ? splitObligationStubDecision
                : ObligationDecision.UNKNOWN;
    }

    public Search getSearch() {
        return search;
    }

    public void setSearch(Search search) {
        this.search = search != null ? search : new Search();
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit != null ? rateLimit : new RateLimit();
    }

    public static class RateLimit {
        private int searchPerMinute = 30;
        private int friendRequestsPerMinute = 20;
        private int guestCreatePerMinute = 10;
        private int guestAvatarPerMinute = 20;
        private int deviceRegisterPerMinute = 10;
        private int wsConnectPerMinute = 20;

        public int getSearchPerMinute() {
            return searchPerMinute;
        }

        public void setSearchPerMinute(int searchPerMinute) {
            this.searchPerMinute = searchPerMinute;
        }

        public int getFriendRequestsPerMinute() {
            return friendRequestsPerMinute;
        }

        public void setFriendRequestsPerMinute(int friendRequestsPerMinute) {
            this.friendRequestsPerMinute = friendRequestsPerMinute;
        }

        public int getGuestCreatePerMinute() {
            return guestCreatePerMinute;
        }

        public void setGuestCreatePerMinute(int guestCreatePerMinute) {
            this.guestCreatePerMinute = guestCreatePerMinute;
        }

        public int getGuestAvatarPerMinute() {
            return guestAvatarPerMinute;
        }

        public void setGuestAvatarPerMinute(int guestAvatarPerMinute) {
            this.guestAvatarPerMinute = guestAvatarPerMinute;
        }

        public int getDeviceRegisterPerMinute() {
            return deviceRegisterPerMinute;
        }

        public void setDeviceRegisterPerMinute(int deviceRegisterPerMinute) {
            this.deviceRegisterPerMinute = deviceRegisterPerMinute;
        }

        public int getWsConnectPerMinute() {
            return wsConnectPerMinute;
        }

        public void setWsConnectPerMinute(int wsConnectPerMinute) {
            this.wsConnectPerMinute = wsConnectPerMinute;
        }
    }

    public List<String> getAvatarAllowlist() {
        return avatarAllowlist;
    }

    public void setAvatarAllowlist(List<String> avatarAllowlist) {
        this.avatarAllowlist = avatarAllowlist != null ? avatarAllowlist : new ArrayList<>();
    }

    public static class Search {
        private int minQueryLength = 2;
        private int maxQueryLength = 50;
        private int defaultLimit = 50;
        private int maxLimit = 100;

        public int getMinQueryLength() {
            return minQueryLength;
        }

        public void setMinQueryLength(int minQueryLength) {
            this.minQueryLength = minQueryLength;
        }

        public int getMaxQueryLength() {
            return maxQueryLength;
        }

        public void setMaxQueryLength(int maxQueryLength) {
            this.maxQueryLength = maxQueryLength;
        }

        public int getDefaultLimit() {
            return defaultLimit;
        }

        public void setDefaultLimit(int defaultLimit) {
            this.defaultLimit = defaultLimit;
        }

        public int getMaxLimit() {
            return maxLimit;
        }

        public void setMaxLimit(int maxLimit) {
            this.maxLimit = maxLimit;
        }
    }
}
