package com.expensio.backend.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierService(@Value("${app.google.client-id:expensio-google-client-id}") String clientId) {
        this.clientId = clientId;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .setIssuers(List.of("https://accounts.google.com", "accounts.google.com"))
                .build();
    }

    public static class GoogleUserInfo {
        private final String subject;
        private final String email;
        private final String name;
        private final String givenName;
        private final String familyName;
        private final String pictureUrl;

        public GoogleUserInfo(String subject, String email, String name, String givenName, String familyName, String pictureUrl) {
            this.subject = subject;
            this.email = email;
            this.name = name;
            this.givenName = givenName;
            this.familyName = familyName;
            this.pictureUrl = pictureUrl;
        }

        public String getSubject() { return subject; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getGivenName() { return givenName; }
        public String getFamilyName() { return familyName; }
        public String getPictureUrl() { return pictureUrl; }
    }

    public GoogleUserInfo verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google ID token must not be null or empty");
        }

        // Support mock tokens for dev and testing
        if (idTokenString.startsWith("mock_google_")) {
            String sub = idTokenString.substring("mock_google_".length());
            log.info("🧪 [Google Verifier] Using mock Google token with sub: {}", sub);
            return new GoogleUserInfo(
                    "google_sub_" + sub,
                    sub + "@gmail.com",
                    "Google User " + sub,
                    "Google",
                    "User " + sub,
                    "https://example.com/avatar.png"
            );
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid or expired Google ID token");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            String subject = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String givenName = (String) payload.get("given_name");
            String familyName = (String) payload.get("family_name");
            String picture = (String) payload.get("picture");

            return new GoogleUserInfo(
                    subject,
                    email != null ? email.toLowerCase().trim() : null,
                    name != null ? name : "Google User",
                    givenName,
                    familyName,
                    picture
            );
        } catch (Exception e) {
            log.warn("Failed to verify Google ID token: {}", e.getMessage());
            throw new IllegalArgumentException("Google ID token verification failed: " + e.getMessage(), e);
        }
    }
}

