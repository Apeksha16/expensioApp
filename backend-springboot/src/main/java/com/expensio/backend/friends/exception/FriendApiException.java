package com.expensio.backend.friends.exception;

import java.util.Map;

public class FriendApiException extends RuntimeException {

    private final FriendErrorCode errorCode;
    private final Map<String, String> fieldErrors;

    public FriendApiException(FriendErrorCode errorCode) {
        this(errorCode, errorCode.getDefaultMessage(), null);
    }

    public FriendApiException(FriendErrorCode errorCode, String message) {
        this(errorCode, message, null);
    }

    public FriendApiException(FriendErrorCode errorCode, String message, Map<String, String> fieldErrors) {
        super(message != null ? message : errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors;
    }

    public FriendErrorCode getErrorCode() {
        return errorCode;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
