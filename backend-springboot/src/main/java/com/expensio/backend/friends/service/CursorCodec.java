package com.expensio.backend.friends.service;

import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

public final class CursorCodec {

    private static final String DELIMITER = "|";

    private CursorCodec() {
    }

    public record FriendshipCursor(Instant createdAt, UUID id) {
    }

    public record SearchCursor(String sortKey, UUID id) {
    }

    public static String encodeFriendshipCursor(Instant createdAt, UUID id) {
        String raw = createdAt.toString() + DELIMITER + id.toString();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static FriendshipCursor decodeFriendshipCursor(String cursor) {
        String decoded = decodeRaw(cursor);
        int idx = decoded.lastIndexOf(DELIMITER);
        if (idx <= 0 || idx == decoded.length() - 1) {
            throw new FriendApiException(FriendErrorCode.INVALID_CURSOR);
        }
        try {
            Instant createdAt = Instant.parse(decoded.substring(0, idx));
            UUID id = UUID.fromString(decoded.substring(idx + 1));
            return new FriendshipCursor(createdAt, id);
        } catch (Exception ex) {
            throw new FriendApiException(FriendErrorCode.INVALID_CURSOR);
        }
    }

    public static String encodeSearchCursor(String sortKey, UUID id) {
        String safeKey = sortKey != null ? sortKey : "";
        String raw = safeKey + DELIMITER + id.toString();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static SearchCursor decodeSearchCursor(String cursor) {
        String decoded = decodeRaw(cursor);
        int idx = decoded.lastIndexOf(DELIMITER);
        if (idx < 0 || idx == decoded.length() - 1) {
            throw new FriendApiException(FriendErrorCode.INVALID_CURSOR);
        }
        try {
            String sortKey = decoded.substring(0, idx);
            UUID id = UUID.fromString(decoded.substring(idx + 1));
            return new SearchCursor(sortKey, id);
        } catch (Exception ex) {
            throw new FriendApiException(FriendErrorCode.INVALID_CURSOR);
        }
    }

    private static String decodeRaw(String cursor) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(cursor);
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new FriendApiException(FriendErrorCode.INVALID_CURSOR);
        }
    }
}
