package com.expensio.backend.friends.config;

import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class FriendsRateLimiter {

    private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();
    private final Clock clock;

    public FriendsRateLimiter() {
        this(Clock.systemUTC());
    }

    public FriendsRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void checkAndConsume(String bucketName, String key, int maxRequests, long windowSeconds) {
        String compositeKey = bucketName + ":" + key;
        Instant now = clock.instant();
        Instant cutoff = now.minusSeconds(windowSeconds);

        Deque<Instant> timestamps = buckets.computeIfAbsent(compositeKey, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && !timestamps.peekFirst().isAfter(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                throw new FriendApiException(FriendErrorCode.RATE_LIMITED);
            }
            timestamps.addLast(now);
        }
    }
}
