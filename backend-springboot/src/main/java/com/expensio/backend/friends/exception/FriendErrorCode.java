package com.expensio.backend.friends.exception;

import org.springframework.http.HttpStatus;

public enum FriendErrorCode {
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Authentication is required"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Access is denied"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found"),
    FRIENDSHIP_NOT_FOUND(HttpStatus.NOT_FOUND, "Friendship not found"),
    GUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Guest not found"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed for request payload"),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Invalid request"),
    INVALID_CURSOR(HttpStatus.BAD_REQUEST, "Invalid pagination cursor"),
    SELF_FRIEND_REQUEST(HttpStatus.UNPROCESSABLE_ENTITY, "Cannot send a friend request to yourself"),
    GUEST_CANNOT_BE_REQUESTED(HttpStatus.UNPROCESSABLE_ENTITY, "Cannot send a friend request to a guest profile"),
    INVALID_AVATAR(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid avatar ID"),
    RELATIONSHIP_EXISTS(HttpStatus.CONFLICT, "A relationship already exists between these users"),
    FRIEND_LIMIT_REACHED(HttpStatus.CONFLICT, "Friend limit reached"),
    TARGET_FRIEND_LIMIT_REACHED(HttpStatus.CONFLICT, "Target user has reached their friend limit"),
    REQUEST_NOT_PENDING(HttpStatus.CONFLICT, "Friend request is no longer pending"),
    OUTSTANDING_SPLIT_OBLIGATIONS(HttpStatus.CONFLICT, "Cannot remove due to outstanding split obligations"),
    GUEST_LIMIT_REACHED(HttpStatus.CONFLICT, "Guest limit reached"),
    USERNAME_TAKEN(HttpStatus.CONFLICT, "Username is already taken"),
    GUEST_NOT_OWNED(HttpStatus.NOT_FOUND, "Guest not found"),
    GUEST_ALREADY_RETIRED(HttpStatus.CONFLICT, "Guest is already retired"),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Too many requests"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected server error occurred. Please try again later.");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    FriendErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
