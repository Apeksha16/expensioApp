package com.expensio.backend.security;

import java.io.Serializable;
import java.security.Principal;
import java.util.Objects;
import java.util.UUID;

/**
 * Authenticated user principal representing the verified user identity in Spring Security.
 * Established directly from a cryptographically validated JWT access token subject.
 */
public class UserPrincipal implements Principal, Serializable {

    private static final long serialVersionUID = 1L;

    private final UUID userId;

    public UserPrincipal(UUID userId) {
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public String getName() {
        return userId.toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }

    @Override
    public String toString() {
        return "UserPrincipal{userId=" + userId + "}";
    }
}
