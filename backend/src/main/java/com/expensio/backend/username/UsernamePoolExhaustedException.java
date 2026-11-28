package com.expensio.backend.username;

import com.expensio.backend.exception.AppException;

public class UsernamePoolExhaustedException extends AppException {

    public UsernamePoolExhaustedException(String message) {
        super(message);
    }

    public UsernamePoolExhaustedException(String message, Throwable cause) {
        super(message, cause);
    }
}

