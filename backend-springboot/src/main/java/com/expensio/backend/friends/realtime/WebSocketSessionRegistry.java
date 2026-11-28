package com.expensio.backend.friends.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(WebSocketSessionRegistry.class);

    private static final class SessionEntry {
        final WebSocketSession webSocketSession;
        volatile UUID userId;
        volatile Instant expiresAt;

        SessionEntry(WebSocketSession webSocketSession) {
            this.webSocketSession = webSocketSession;
        }
    }

    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();

    public void registerTransportSession(WebSocketSession session) {
        sessions.put(session.getId(), new SessionEntry(session));
    }

    public void bindAuthenticatedUser(String sessionId, UUID userId, Instant expiresAt) {
        SessionEntry entry = sessions.computeIfAbsent(sessionId, id -> new SessionEntry(null));
        entry.userId = userId;
        entry.expiresAt = expiresAt;
    }

    public void removeSession(String sessionId) {
        if (sessionId != null) {
            sessions.remove(sessionId);
        }
    }

    public boolean hasActiveSession(UUID userId) {
        if (userId == null) {
            return false;
        }
        Instant now = Instant.now();
        return sessions.values().stream()
                .anyMatch(e -> userId.equals(e.userId)
                        && (e.expiresAt == null || e.expiresAt.isAfter(now))
                        && (e.webSocketSession == null || e.webSocketSession.isOpen()));
    }

    public void closeSessionsForUser(UUID userId) {
        if (userId == null) {
            return;
        }
        sessions.forEach((id, entry) -> {
            if (userId.equals(entry.userId)) {
                closeQuietly(id, entry, CloseStatus.POLICY_VIOLATION);
            }
        });
    }

    @Scheduled(fixedDelayString = "${app.friends.ws.expiry-sweep-ms:30000}")
    public void closeExpiredSessions() {
        Instant now = Instant.now();
        sessions.forEach((id, entry) -> {
            if (entry.expiresAt != null && !entry.expiresAt.isAfter(now)) {
                closeQuietly(id, entry, CloseStatus.POLICY_VIOLATION);
            }
        });
    }

    private void closeQuietly(String sessionId, SessionEntry entry, CloseStatus status) {
        sessions.remove(sessionId);
        if (entry.webSocketSession != null && entry.webSocketSession.isOpen()) {
            try {
                entry.webSocketSession.close(status);
            } catch (IOException ex) {
                log.debug("Failed to close WebSocket session {}: {}", sessionId, ex.getMessage());
            }
        }
    }
}
