package com.expensio.backend.friends.config;

import com.expensio.backend.friends.policy.DefaultSplitObligationPolicy;
import com.expensio.backend.friends.policy.SplitObligationPolicy;
import com.expensio.backend.friends.push.NoOpPushGateway;
import com.expensio.backend.friends.push.PushGateway;
import com.expensio.backend.friends.realtime.NotificationGateway;
import com.expensio.backend.friends.realtime.StompNotificationGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Configuration
public class FriendsModuleConfig {

    @Bean
    @ConditionalOnMissingBean(SplitObligationPolicy.class)
    public SplitObligationPolicy defaultSplitObligationPolicy(FriendsProperties properties) {
        return new DefaultSplitObligationPolicy(properties);
    }

    @Bean
    @ConditionalOnMissingBean(NotificationGateway.class)
    public NotificationGateway stompNotificationGateway(SimpMessagingTemplate messagingTemplate) {
        return new StompNotificationGateway(messagingTemplate);
    }

    @Bean
    @ConditionalOnMissingBean(PushGateway.class)
    public PushGateway noOpPushGateway() {
        return new NoOpPushGateway();
    }
}
