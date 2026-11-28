package com.expensio.backend.friends;

import com.expensio.backend.config.AppConfig;
import com.expensio.backend.config.CorsConfig;
import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.security.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FriendsSecurityFilterChainTest {

    @Configuration
    @EnableWebMvc
    @EnableConfigurationProperties(JwtProperties.class)
    @Import({
            SecurityConfig.class,
            AppConfig.class,
            CorsConfig.class,
            JwtService.class,
            JwtAuthenticationFilter.class,
            JwtAuthenticationEntryPoint.class,
            RequestIdFilter.class,
            GlobalExceptionHandler.class,
            DummyFriendsController.class
    })
    static class TestConfig {
        @Bean
        ObjectMapper objectMapper() {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            return mapper;
        }
    }

    @RestController
    @RequestMapping("/api/v1/friends")
    static class DummyFriendsController {
        @GetMapping("/ping")
        public Map<String, String> ping(@AuthenticationPrincipal UserPrincipal principal) {
            return Map.of("userId", principal.getUserId().toString());
        }
    }

    private static AnnotationConfigWebApplicationContext context;
    private static MockMvc mockMvc;
    private static JwtService jwtService;

    @BeforeAll
    static void setUpAll() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("app.jwt.secret", "test_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256_tests!")
                .withProperty("app.jwt.access-token-expiration-ms", "3600000")
                .withProperty("app.jwt.refresh-token-expiration-ms", "86400000")
                .withProperty("app.jwt.issuer", "expensio-api-test");

        context = new AnnotationConfigWebApplicationContext();
        context.setEnvironment(env);
        context.setServletContext(new MockServletContext());
        context.register(TestConfig.class);
        context.refresh();

        jwtService = context.getBean(JwtService.class);
        RequestIdFilter requestIdFilter = context.getBean(RequestIdFilter.class);

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(requestIdFilter)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @AfterAll
    static void tearDownAll() {
        if (context != null) {
            context.close();
        }
    }

    @Test
    @DisplayName("Unauthenticated call to /api/v1/friends/** returns 401 with standard error body")
    void unauthenticatedCall_Returns401WithStandardErrorBody() throws Exception {
        mockMvc.perform(get("/api/v1/friends/ping")
                        .header(RequestIdFilter.CORRELATION_ID_HEADER, "corr-unauth-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.correlationId").value("corr-unauth-1"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Onboarding token calling /api/v1/friends/** is rejected with 403")
    void onboardingToken_Returns403() throws Exception {
        UUID userId = UUID.randomUUID();
        String onboardingToken = jwtService.generateOnboardingToken(userId);

        mockMvc.perform(get("/api/v1/friends/ping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + onboardingToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Valid APPLICATION JWT reaches /api/v1/friends/** with principal ID from security context")
    void validApplicationToken_SucceedsWithPrincipalId() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId);

        mockMvc.perform(get("/api/v1/friends/ping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()));
    }
}
