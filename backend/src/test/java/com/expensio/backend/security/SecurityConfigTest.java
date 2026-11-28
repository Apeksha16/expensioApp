package com.expensio.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(SecurityConfigTest.TestProtectedController.class)
class SecurityConfigTest {

    @RestController
    @RequestMapping("/api/v1/test")
    static class TestProtectedController {
        @GetMapping("/secure")
        public ResponseEntity<Map<String, Object>> secureEndpoint(
                @AuthenticationPrincipal UserPrincipal principal,
                @RequestHeader(value = "X-User-Id", required = false) String spoofedHeader,
                @RequestParam(value = "userId", required = false) String spoofedParam) {
            return ResponseEntity.ok(Map.of(
                    "status", "authenticated",
                    "userId", principal.getUserId().toString()
            ));
        }
    }

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Protected endpoint without token returns 401 Unauthorized in standardized format")
    void protectedEndpoint_WithoutToken_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/protected-resource")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"))
                .andExpect(jsonPath("$.path").value("/api/v1/protected-resource"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Protected endpoint succeeds when presented with a valid signed JWT")
    void protectedEndpoint_WithValidToken_ShouldAuthenticateAndReturnUserIdentity() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId);

        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("authenticated"))
                .andExpect(jsonPath("$.userId").value(userId.toString()));
    }

    @Test
    @DisplayName("Protected endpoint rejects expired JWT with 401 Unauthorized")
    void protectedEndpoint_WithExpiredToken_ShouldReturn401Unauthorized() throws Exception {
        UUID userId = UUID.randomUUID();
        Instant issuedAt = Instant.now().minusSeconds(7200);
        Instant expiredAt = Instant.now().minusSeconds(3600);
        String expiredToken = jwtService.generateAccessToken(userId, issuedAt, expiredAt);

        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"));
    }

    @Test
    @DisplayName("Protected endpoint rejects tampered or invalid signature JWT with 401 Unauthorized")
    void protectedEndpoint_WithTamperedToken_ShouldReturn401Unauthorized() throws Exception {
        UUID userId = UUID.randomUUID();
        String validToken = jwtService.generateAccessToken(userId);
        // Tamper with the signature portion
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "abcde";

        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tamperedToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Protected endpoint rejects malformed bearer token string with 401 Unauthorized")
    void protectedEndpoint_WithMalformedBearerToken_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer malformed.token.string")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Protected endpoint rejects empty bearer token with 401 Unauthorized")
    void protectedEndpoint_WithEmptyBearerToken_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer    ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Unrelated request data (headers or query params) cannot spoof or change authenticated UUID")
    void protectedEndpoint_UnrelatedRequestData_CannotOverrideAuthenticatedIdentity() throws Exception {
        UUID authenticatedUserId = UUID.randomUUID();
        String spoofedId = UUID.randomUUID().toString();
        String token = jwtService.generateAccessToken(authenticatedUserId);

        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .header("X-User-Id", spoofedId)
                        .param("userId", spoofedId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(authenticatedUserId.toString()));
    }

    @Test
    @DisplayName("Each request receives an isolated and independent SecurityContext")
    void protectedEndpoint_ConsecutiveRequests_MaintainIndependentSecurityContexts() throws Exception {
        UUID userOne = UUID.randomUUID();
        UUID userTwo = UUID.randomUUID();

        String tokenOne = jwtService.generateAccessToken(userOne);
        String tokenTwo = jwtService.generateAccessToken(userTwo);

        // First request as User 1
        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOne))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userOne.toString()));

        // Second request as User 2
        mockMvc.perform(get("/api/v1/test/secure")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenTwo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userTwo.toString()));

        // Third unauthenticated request must not inherit previous context
        mockMvc.perform(get("/api/v1/test/secure"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Public health endpoints remain permitted without authentication token")
    void healthEndpoints_WithoutToken_ShouldBePermitted() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/api/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/actuator/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
