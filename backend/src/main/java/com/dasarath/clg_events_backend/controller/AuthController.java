package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.auth.UserProfileDto;
import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user profile and auth state")
@SecurityRequirement(name = "bearerAuth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Returns user ID, email, display name, avatar, and resolved role")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser() {
        String userId = SecurityUtils.getCurrentUserId();
        UserProfileDto profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }
}
