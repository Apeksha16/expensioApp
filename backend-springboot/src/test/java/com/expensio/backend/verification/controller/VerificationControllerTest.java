package com.expensio.backend.verification.controller;

import com.expensio.backend.auth.dto.OtpResponse;
import com.expensio.backend.exception.GlobalExceptionHandler;
import com.expensio.backend.verification.dto.*;
import com.expensio.backend.verification.service.VerificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class VerificationControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        VerificationService stubService = new VerificationService(null, null, null) {
            @Override
            public OtpResponse startEmailVerification(EmailVerificationStartRequest request, String ip, String dev) {
                return new OtpResponse("email-challenge-1", 300, 60, "Verification OTP sent to email");
            }

            @Override
            public boolean verifyEmail(EmailVerificationVerifyRequest request) {
                return "123456".equals(request.getOtp());
            }

            @Override
            public OtpResponse startMobileVerification(MobileVerificationStartRequest request, String ip, String dev) {
                return new OtpResponse("mobile-challenge-1", 300, 60, "Verification OTP sent to mobile");
            }

            @Override
            public boolean verifyMobile(MobileVerificationVerifyRequest request) {
                return "654321".equals(request.getOtp());
            }
        };

        VerificationController controller = new VerificationController(stubService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /v1/verification/email/start should return challenge")
    void testStartEmailVerification() throws Exception {
        EmailVerificationStartRequest request = new EmailVerificationStartRequest("verify@expensio.app");

        mockMvc.perform(post("/v1/verification/email/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.challengeId").value("email-challenge-1"));
    }

    @Test
    @DisplayName("POST /v1/verification/email/verify should verify OTP")
    void testVerifyEmail() throws Exception {
        EmailVerificationVerifyRequest request = new EmailVerificationVerifyRequest("verify@expensio.app", "123456", "email-challenge-1");

        mockMvc.perform(post("/v1/verification/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(true));
    }
}

