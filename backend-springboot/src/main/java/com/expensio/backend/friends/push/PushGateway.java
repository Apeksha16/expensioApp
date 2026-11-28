package com.expensio.backend.friends.push;

import com.expensio.backend.friends.realtime.FriendRealtimeEvent;

public interface PushGateway {

    PushResult sendPush(DeviceToken deviceToken, FriendRealtimeEvent event);
}
