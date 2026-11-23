package com.expensio.backend.auth.controller;

import com.expensio.backend.auth.dto.*;
import com.expensio.backend.auth.service.AuthService;
import com.expensio.backend.common.dto.ApiResponse;
import com.expensio.backend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.authenticateGoogle(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("Google authentication successful", response));
    }

    @PostMapping("/email/signup")
    public ResponseEntity<ApiResponse<OtpResponse>> emailSignup(
            @Valid @RequestBody EmailSignupRequest request,
            HttpServletRequest httpRequest) {
        OtpResponse response = authService.registerEmail(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/email/login")
    public ResponseEntity<ApiResponse<AuthResponse>> emailLogin(
            @Valid @RequestBody EmailLoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.loginEmail(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/mobile/otp/start")
    public ResponseEntity<ApiResponse<OtpResponse>> mobileOtpStart(
            @Valid @RequestBody MobileOtpStartRequest request,
            HttpServletRequest httpRequest) {
        OtpResponse response = authService.startMobileOtp(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/mobile/otp/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> mobileOtpVerify(
            @Valid @RequestBody MobileOtpVerifyRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.verifyMobileOtp(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("Mobile verification successful", response));
    }

    @PostMapping("/mobile/login/start")
    public ResponseEntity<ApiResponse<OtpResponse>> mobileLoginStart(
            @Valid @RequestBody MobileOtpStartRequest request,
            HttpServletRequest httpRequest) {
        OtpResponse response = authService.startMobileOtp(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok(response.getMessage(), response));
    }

    @PostMapping("/mobile/login/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> mobileLoginVerify(
            @Valid @RequestBody MobileOtpVerifyRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.verifyMobileOtp(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("Mobile login successful", response));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("If an account exists with this email, password reset instructions have been sent.", null));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.resetPassword(request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully.", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.refreshToken(
                request,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        String rawToken = request != null ? request.getRefreshToken() : null;
        UUID userId = principal != null ? principal.getUserId() : null;
        authService.logout(rawToken, userId, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        UUID userId = principal != null ? principal.getUserId() : null;
        authService.logoutAll(userId, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("All sessions logged out successfully", null));
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

