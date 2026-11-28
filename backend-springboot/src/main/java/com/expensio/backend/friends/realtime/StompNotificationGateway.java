package com.expensio.backend.friends.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.UUID;

public class StompNotificationGateway implements NotificationGateway {

    public static final String FRIENDS_QUEUE = "/queue/friends";

    private final SimpMessagingTemplate messagingTemplate;

    public StompNotificationGateway(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void sendFriendEvent(UUID recipientUserId, FriendRealtimeEvent event) {
        messagingTemplate.convertAndSendToUser(recipientUserId.toString(), FRIENDS_QUEUE, event);
    }
}
