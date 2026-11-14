package com.expensio.backend.username;

import com.expensio.backend.profile.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UsernameGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(UsernameGeneratorService.class);

    private static final Set<String> RESERVED_USERNAMES = Set.of(
            "admin", "administrator", "root", "system", "expensio", "support",
            "moderator", "help", "api", "auth", "null", "undefined", "guest",
            "superuser", "contact", "security", "test", "demo", "billing", "info"
    );

    private final UserProfileRepository userProfileRepository;

    public UsernameGeneratorService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Generates a unique username candidate based on user's first and last name.
     * Follows the exact candidate generation priority:
     * 1. first
     * 2. first + last
     * 3. last + first
     * 4. first1 to first9
     * 5. first + last1 to first + last9
     * 6. last + first1 to last + first9
     * 7. first0, first + last0, last + first0
     */
    public String generateUsername(String firstName, String lastName) {
        String normFirst = normalize(firstName);
        String normLast = normalize(lastName);

        if (normFirst.isBlank() && normLast.isBlank()) {
            normFirst = "user";
        } else if (normFirst.isBlank()) {
            normFirst = normLast;
            normLast = "";
        }

        LinkedHashSet<String> candidates = new LinkedHashSet<>();

        // 1. first
        candidates.add(normFirst);

        // 2. first + last & 3. last + first (if last name is present)
        if (!normLast.isBlank()) {
            candidates.add(normFirst + normLast);
            candidates.add(normLast + normFirst);
        }

        // 4. first1 to first9
        for (int i = 1; i <= 9; i++) {
            candidates.add(normFirst + i);
        }

        // 5. first + last1 to first + last9 & 6. last + first1 to last + first9
        if (!normLast.isBlank()) {
            for (int i = 1; i <= 9; i++) {
                candidates.add(normFirst + normLast + i);
            }
            for (int i = 1; i <= 9; i++) {
                candidates.add(normLast + normFirst + i);
            }
        }

        // 7. first0, first + last0, last + first0
        candidates.add(normFirst + "0");
        if (!normLast.isBlank()) {
            candidates.add(normFirst + normLast + "0");
            candidates.add(normLast + normFirst + "0");
        }

        // Check availability
        for (String candidate : candidates) {
            if (isAvailable(candidate)) {
                log.info("Selected unique username: {}", candidate);
                return candidate;
            }
        }

        // Fallback with random suffix if all deterministic candidates are exhausted
        for (int retry = 0; retry < 10; retry++) {
            String fallback = normFirst + (100 + new Random().nextInt(900));
            if (isAvailable(fallback)) {
                log.info("Selected fallback unique username: {}", fallback);
                return fallback;
            }
        }

        throw new UsernamePoolExhaustedException("Unable to generate unique username. All candidate pools exhausted.");
    }

    public boolean isAvailable(String username) {
        if (username == null || username.isBlank() || username.length() < 3 || username.length() > 30) {
            return false;
        }
        String normalized = normalize(username);
        if (RESERVED_USERNAMES.contains(normalized)) {
            return false;
        }
        return !userProfileRepository.existsByUsernameIgnoreCase(normalized);
    }

    public String normalize(String input) {
        if (input == null) return "";
        return input.trim().toLowerCase().replaceAll("[^a-z0-9_]", "");
    }
}

