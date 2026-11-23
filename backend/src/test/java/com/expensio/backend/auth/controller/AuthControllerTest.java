package com.expensio.backend.auth.controller;

import com.expensio.backend.auth.dto.*;
import com.expensio.backend.auth.service.AuthService;
import com.expensio.backend.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Proxy;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Subclass stub to handle controller endpoints without dynamic mocking agents
        AuthService stubAuthService = new AuthService(
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
        ) {
            @Override
            public AuthResponse authenticateGoogle(GoogleAuthRequest request, String ipAddress, String deviceInfo) {
                UserDto user = new UserDto(UUID.randomUUID(), "google@test.com", null, "Google User", "PENDING_ONBOARDING");
                return new AuthResponse("mock-google-token", "mock-refresh", "ONBOARDING", 86400000L, user, "PENDING_ONBOARDING", false, "Google authentication successful");
            }

            @Override
            public OtpResponse registerEmail(EmailSignupRequest request, String ipAddress, String deviceId) {
                return new OtpResponse("challenge-123", 300, 60, "Verification OTP sent to your email.");
            }

            @Override
            public AuthResponse loginEmail(EmailLoginRequest request, String ipAddress, String deviceInfo) {
                UserDto user = new UserDto(UUID.randomUUID(), request.getEmail(), null, "Test User", "ACTIVE");
                return new AuthResponse("mock-app-token", "mock-refresh", "APPLICATION", 86400000L, user, "COMPLETED", true, "Login successful");
            }
        };

        AuthController controller = new AuthController(stubAuthService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /v1/auth/google should authenticate and return 200")
    void testGoogleAuthEndpoint() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest("mock-valid-id-token");

        mockMvc.perform(post("/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-google-token"))
                .andExpect(jsonPath("$.data.tokenType").value("ONBOARDING"))
                .andExpect(jsonPath("$.data.onboardingStatus").value("PENDING_ONBOARDING"));
    }

    @Test
    @DisplayName("POST /v1/auth/email/signup should validate request and return challenge")
    void testEmailSignupEndpoint() throws Exception {
        EmailSignupRequest request = new EmailSignupRequest("test@expensio.app", "P@ssword123", "Expensio User");

        mockMvc.perform(post("/v1/auth/email/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.challengeId").value("challenge-123"))
                .andExpect(jsonPath("$.data.expiresInSeconds").value(300));
    }

    @Test
    @DisplayName("POST /v1/auth/email/signup should return 400 on invalid email or short password")
    void testEmailSignupValidation() throws Exception {
        EmailSignupRequest request = new EmailSignupRequest("invalid-email", "short", "");

        mockMvc.perform(post("/v1/auth/email/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @DisplayName("POST /v1/auth/email/login should return full session on valid credentials")
    void testEmailLoginEndpoint() throws Exception {
        EmailLoginRequest request = new EmailLoginRequest("test@expensio.app", "P@ssword123");

        mockMvc.perform(post("/v1/auth/email/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-app-token"))
                .andExpect(jsonPath("$.data.tokenType").value("APPLICATION"))
                .andExpect(jsonPath("$.data.isProfileComplete").value(true));
    }
}
