package com.expensio.backend.friends.realtime;

import com.expensio.backend.friends.config.FriendsProperties;
import com.expensio.backend.friends.config.FriendsRateLimiter;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.security.JwtService;
import com.expensio.backend.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    public static final String ALLOWED_SUBSCRIBE_DESTINATION = "/user/queue/friends";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final WebSocketSessionRegistry sessionRegistry;
    private final FriendsRateLimiter rateLimiter;
    private final FriendsProperties properties;

    public StompJwtChannelInterceptor(JwtService jwtService, WebSocketSessionRegistry sessionRegistry) {
        this(jwtService, sessionRegistry, new FriendsRateLimiter(), new FriendsProperties());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public StompJwtChannelInterceptor(
            JwtService jwtService,
            WebSocketSessionRegistry sessionRegistry,
            FriendsRateLimiter rateLimiter,
            FriendsProperties properties) {
        this.jwtService = jwtService;
        this.sessionRegistry = sessionRegistry;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            if (!accessor.isMutable()) {
                accessor = StompHeaderAccessor.wrap(message);
                handleConnect(accessor);
                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
            }
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            throw new MessageDeliveryException("Client SEND to application destinations is not permitted");
        } else if (StompCommand.DISCONNECT.equals(command)) {
            sessionRegistry.removeSession(accessor.getSessionId());
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            throw new MessageDeliveryException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        try {
            Claims claims = jwtService.parseAndValidateClaims(token);
            String tokenType = claims.get("token_type", String.class);
            if (!"APPLICATION".equalsIgnoreCase(tokenType)) {
                throw new MessageDeliveryException("Insufficient token scope for WebSocket connection");
            }
            UUID userId = UUID.fromString(claims.getSubject());
            try {
                rateLimiter.checkAndConsume(
                        "ws_connect",
                        userId.toString(),
                        properties.getRateLimit().getWsConnectPerMinute(),
                        60
                );
            } catch (FriendApiException ex) {
                throw new MessageDeliveryException("WebSocket rate limit exceeded");
            }
            Instant expiresAt = claims.getExpiration() != null ? claims.getExpiration().toInstant() : null;

            UserPrincipal principal = new UserPrincipal(userId, tokenType);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_APPLICATION"))
            );
            accessor.setUser(auth);

            if (accessor.getSessionId() != null) {
                sessionRegistry.bindAuthenticatedUser(accessor.getSessionId(), userId, expiresAt);
            }
        } catch (MessageDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new MessageDeliveryException("Invalid or expired JWT token");
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw new MessageDeliveryException("Unauthenticated STOMP subscription");
        }
        String destination = accessor.getDestination();
        if (!ALLOWED_SUBSCRIBE_DESTINATION.equals(destination)) {
            throw new MessageDeliveryException("Subscription to destination is not allowed: " + destination);
        }
    }
}
