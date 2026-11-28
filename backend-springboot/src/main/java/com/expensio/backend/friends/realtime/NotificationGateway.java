package com.expensio.backend.friends.realtime;

import java.util.UUID;

public interface NotificationGateway {

    void sendFriendEvent(UUID recipientUserId, FriendRealtimeEvent event);
}
