package com.expensio.backend.verification.controller;

import com.expensio.backend.auth.dto.OtpResponse;
import com.expensio.backend.common.dto.ApiResponse;
import com.expensio.backend.verification.dto.*;
import com.expensio.backend.verification.service.VerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/verification")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping("/email/start")
    public ResponseEntity<ApiResponse<OtpResponse>> startEmailVerification(
            @Valid @RequestBody EmailVerificationStartRequest request,
            HttpServletRequest httpRequest) {
        OtpResponse response = verificationService.startEmailVerification(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyEmail(
            @Valid @RequestBody EmailVerificationVerifyRequest request) {
        boolean verified = verificationService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully", verified));
    }

    @PostMapping("/mobile/start")
    public ResponseEntity<ApiResponse<OtpResponse>> startMobileVerification(
            @Valid @RequestBody MobileVerificationStartRequest request,
            HttpServletRequest httpRequest) {
        OtpResponse response = verificationService.startMobileVerification(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/mobile/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyMobile(
            @Valid @RequestBody MobileVerificationVerifyRequest request) {
        boolean verified = verificationService.verifyMobile(request);
        return ResponseEntity.ok(ApiResponse.ok("Mobile verified successfully", verified));
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xf)) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getUserAgent(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return (ua != null && ua.length() > 250) ? ua.substring(0, 250) : ua;
    }
}

