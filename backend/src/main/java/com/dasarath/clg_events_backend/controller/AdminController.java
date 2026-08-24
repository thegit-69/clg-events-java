package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.admin.ReviewEventRequest;
import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.dto.event.EventResponseDto;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Governance", description = "Endpoints for Super Admin event moderation and approvals")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/pending-events")
    @Operation(summary = "List all pending event proposals", description = "Accessible only by Super Admin")
    public ResponseEntity<ApiResponse<List<EventResponseDto>>> getPendingEvents() {
        List<EventResponseDto> pending = adminService.getPendingEvents();
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @PutMapping("/events/{id}/review")
    @Operation(summary = "Review event proposal (Approve / Reject)", description = "Accessible only by Super Admin")
    public ResponseEntity<ApiResponse<EventResponseDto>> reviewEventPut(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewEventRequest request
    ) {
        String adminId = SecurityUtils.getCurrentUserId();
        EventResponseDto reviewed = adminService.reviewEvent(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success("Event review completed successfully", reviewed));
    }

    @PostMapping("/events/{id}/review")
    @Operation(summary = "Review event proposal (POST alternative)", description = "Accessible only by Super Admin")
    public ResponseEntity<ApiResponse<EventResponseDto>> reviewEventPost(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewEventRequest request
    ) {
        return reviewEventPut(id, request);
    }
}
