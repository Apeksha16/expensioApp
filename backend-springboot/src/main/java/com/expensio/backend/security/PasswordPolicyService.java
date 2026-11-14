package com.expensio.backend.security;

import com.expensio.backend.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class PasswordPolicyService {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    private static final Pattern HAS_UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern HAS_LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");
    private static final Pattern HAS_SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]");

    // Common weak passwords list
    private static final String[] WEAK_PASSWORDS = {
            "password", "password123", "12345678", "qwerty123", "admin123", "welcome123", "expensio123"
    };

    public void validatePassword(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BadRequestException("Password must be at least " + MIN_LENGTH + " characters long");
        }
        if (password.length() > MAX_LENGTH) {
            throw new BadRequestException("Password must not exceed " + MAX_LENGTH + " characters");
        }
        if (!HAS_UPPERCASE.matcher(password).find()) {
            throw new BadRequestException("Password must contain at least one uppercase letter");
        }
        if (!HAS_LOWERCASE.matcher(password).find()) {
            throw new BadRequestException("Password must contain at least one lowercase letter");
        }
        if (!HAS_DIGIT.matcher(password).find()) {
            throw new BadRequestException("Password must contain at least one digit");
        }
        if (!HAS_SPECIAL.matcher(password).find()) {
            throw new BadRequestException("Password must contain at least one special character");
        }
        String lower = password.toLowerCase();
        for (String weak : WEAK_PASSWORDS) {
            if (lower.equals(weak)) {
                throw new BadRequestException("Password is too common or easily guessable");
            }
        }
    }
}

