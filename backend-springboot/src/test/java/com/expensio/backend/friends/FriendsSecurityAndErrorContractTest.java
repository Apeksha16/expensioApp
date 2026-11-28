package com.expensio.backend.friends;

import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.friends.exception.FriendApiException;
import com.expensio.backend.friends.exception.FriendErrorCode;
import com.expensio.backend.security.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FriendsSecurityAndErrorContractTest {

    @RestController
    @RequestMapping("/api/v1/friends")
    static class TestFriendsProbeController {
        @GetMapping("/probe")
        public String probe() {
            return "ok";
        }

        @GetMapping("/boom-sql")
        public String boomSql() {
            throw new RuntimeException("ERROR: duplicate key value violates unique constraint \"uq_friendships_pair\" Detail: SELECT * FROM friendships");
        }

        @GetMapping("/domain-conflict")
        public String domainConflict() {
            throw new FriendApiException(FriendErrorCode.FRIEND_LIMIT_REACHED);
        }
    }

    private MockMvc mockMvc;
    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("test_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256_tests!");
        jwtProperties.setAccessTokenExpirationMs(3600000L);
        jwtProperties.setRefreshTokenExpirationMs(86400000L);
        jwtProperties.setIssuer("expensio-api-test");
        jwtService = new JwtService(jwtProperties);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        JwtAuthenticationEntryPoint entryPoint = new JwtAuthenticationEntryPoint(objectMapper);
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, entryPoint);
        RequestIdFilter requestIdFilter = new RequestIdFilter();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestFriendsProbeController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(requestIdFilter, jwtFilter)
                .build();
    }

    @Test
    @DisplayName("Correlation ID header X-Correlation-Id is echoed in response and error body")
    void correlationId_IsEchoedInErrorBodyAndHeader() throws Exception {
        String correlationId = "corr-phase0-123";

        mockMvc.perform(get("/api/v1/friends/domain-conflict")
                        .header(RequestIdFilter.CORRELATION_ID_HEADER, correlationId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(header().string(RequestIdFilter.CORRELATION_ID_HEADER, correlationId))
                .andExpect(jsonPath("$.code").value("FRIEND_LIMIT_REACHED"))
                .andExpect(jsonPath("$.correlationId").value(correlationId))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.message").value("Friend limit reached"));
    }

    @Test
    @DisplayName("Unhandled exception never exposes SQL or stack traces in error response")
    void unhandledException_NeverExposesSqlOrStackTrace() throws Exception {
        mockMvc.perform(get("/api/v1/friends/boom-sql")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("An unexpected server error occurred. Please try again later."))
                .andExpect(content().string(not(containsString("SELECT"))))
                .andExpect(content().string(not(containsString("uq_friendships_pair"))))
                .andExpect(content().string(not(containsString("RuntimeException"))));
    }
}
