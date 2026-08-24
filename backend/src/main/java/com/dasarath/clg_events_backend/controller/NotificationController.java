package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.dto.notification.NotificationDto;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Endpoints for user alerts, approvals, and reminders")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Returns all notifications for the current authenticated user")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications() {
        String userId = SecurityUtils.getCurrentUserId();
        List<NotificationDto> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PatchMapping("/mark-read")
    @Operation(summary = "Mark all notifications as read", description = "Updates all unread notifications to read for current user")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        String userId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @PatchMapping("/{id}/mark-read")
    @Operation(summary = "Mark single notification as read", description = "Updates status of a specific notification")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        String userId = SecurityUtils.getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification", description = "Deletes a notification record")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable UUID id) {
        String userId = SecurityUtils.getCurrentUserId();
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}
