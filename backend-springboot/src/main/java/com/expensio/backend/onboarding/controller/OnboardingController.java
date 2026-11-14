package com.expensio.backend.onboarding.controller;

import com.expensio.backend.auth.dto.UserDto;
import com.expensio.backend.common.dto.ApiResponse;
import com.expensio.backend.onboarding.UserEmployment;
import com.expensio.backend.onboarding.UserFinancialProfile;
import com.expensio.backend.onboarding.dto.*;
import com.expensio.backend.onboarding.service.OnboardingService;
import com.expensio.backend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    /**
     * 2.5 Get Onboarding Configuration (supported types, fields, validation limits)
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<OnboardingConfigResponse>> getConfig() {
        OnboardingConfigResponse config = onboardingService.getConfig();
        return ResponseEntity.ok(ApiResponse.ok("Onboarding configuration retrieved successfully", config));
    }

    /**
     * 2.1 Get Current Onboarding Progress and Status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> getStatus(
            @AuthenticationPrincipal UserPrincipal principal) {
        OnboardingStatusResponse status = onboardingService.getStatus(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Onboarding status retrieved successfully", status));
    }

    /**
     * 2.2 Update Profile Information
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        UserDto updated = onboardingService.updateProfile(principal.getUserId(), request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    /**
     * 2.3 Update Employment Information
     */
    @PutMapping("/employment")
    public ResponseEntity<ApiResponse<UserEmployment>> updateEmployment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateEmploymentRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        UserEmployment updated = onboardingService.updateEmployment(principal.getUserId(), request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Employment updated successfully", updated));
    }

    /**
     * 2.4 Update Initial Financial Profile
     */
    @PutMapping("/financial-profile")
    public ResponseEntity<ApiResponse<UserFinancialProfile>> updateFinancialProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateFinancialProfileRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        UserFinancialProfile updated = onboardingService.updateFinancialProfile(principal.getUserId(), request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Financial profile updated successfully", updated));
    }

    /**
     * 2.6 Complete Onboarding and Activate Account
     */
    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<OnboardingCompletionResponse>> completeOnboarding(
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String deviceInfo = servletRequest.getHeader("User-Agent");
        OnboardingCompletionResponse response = onboardingService.completeOnboarding(principal.getUserId(), ipAddress, deviceInfo);
        return ResponseEntity.ok(ApiResponse.ok("Onboarding completed successfully", response));
    }
}

