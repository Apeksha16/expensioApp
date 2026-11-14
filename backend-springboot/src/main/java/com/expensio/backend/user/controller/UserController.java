package com.expensio.backend.user.controller;

import com.expensio.backend.common.dto.ApiResponse;
import com.expensio.backend.onboarding.dto.UpdateProfileRequest;
import com.expensio.backend.security.UserPrincipal;
import com.expensio.backend.user.dto.UserProfileDetailResponse;
import com.expensio.backend.user.dto.UpdateUsernameRequest;
import com.expensio.backend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 4.1 Authenticated User Profile Retrieval
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDetailResponse>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        UserProfileDetailResponse response = userService.getMe(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved successfully", response));
    }

    /**
     * 4.1 Authenticated User Profile Update
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDetailResponse>> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        UserProfileDetailResponse response = userService.updateMe(principal.getUserId(), request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("User profile updated successfully", response));
    }

    /**
     * 3.2 Secure Username Change API
     */
    @PutMapping("/me/username")
    public ResponseEntity<ApiResponse<UserProfileDetailResponse>> updateUsername(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUsernameRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        UserProfileDetailResponse response = userService.updateUsername(principal.getUserId(), request.getUsername(), ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Username updated successfully", response));
    }
}

