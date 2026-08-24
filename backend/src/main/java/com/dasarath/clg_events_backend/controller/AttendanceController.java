package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.attendance.AttendanceStatusDto;
import com.dasarath.clg_events_backend.dto.attendance.MarkAttendanceRequest;
import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Attendance & Certificates", description = "Endpoints for QR attendance verification and real-time certificate unlocking")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/events/{eventId}/attendance-status")
    @Operation(summary = "Check user attendance status", description = "Returns registered & attended boolean flags for certificate download unlock")
    public ResponseEntity<ApiResponse<AttendanceStatusDto>> getAttendanceStatus(@PathVariable UUID eventId) {
        String userId = SecurityUtils.getCurrentUserId();
        AttendanceStatusDto status = attendanceService.getAttendanceStatus(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PostMapping("/attendance/mark")
    @Operation(summary = "Mark attendee attendance by QR ticket ID", description = "Requires event organizer or super admin. Automatically broadcasts real-time unlock.")
    public ResponseEntity<ApiResponse<AttendeeDto>> markAttendance(@Valid @RequestBody MarkAttendanceRequest request) {
        String markerUserId = SecurityUtils.getCurrentUserId();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();
        AttendeeDto attendee = attendanceService.markAttendance(request.registrationId(), markerUserId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success("Attendance verified successfully", attendee));
    }
}
