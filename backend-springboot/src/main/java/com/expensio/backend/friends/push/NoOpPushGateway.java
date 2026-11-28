package com.expensio.backend.friends.push;

import com.expensio.backend.friends.realtime.FriendRealtimeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NoOpPushGateway implements PushGateway {

    private static final Logger log = LoggerFactory.getLogger(NoOpPushGateway.class);

    @Override
    public PushResult sendPush(DeviceToken deviceToken, FriendRealtimeEvent event) {
        log.debug("No-op push for platform={}, eventType={}, eventId={}",
                deviceToken.getPlatform(), event.type(), event.eventId());
        return PushResult.SENT;
    }
}
