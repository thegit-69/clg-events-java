package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.dto.registration.AttendeeDto;
import com.dasarath.clg_events_backend.dto.registration.RegisterRequest;
import com.dasarath.clg_events_backend.dto.registration.TicketDto;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Registrations & Passes", description = "Endpoints for event ticket registration and attendee lists")
@SecurityRequirement(name = "bearerAuth")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping({"/events/{eventId}/register", "/registrations/{eventId}"})
    @Operation(summary = "Register for an event", description = "Generates a digital ticket with unique QR pass UUID")
    public ResponseEntity<ApiResponse<TicketDto>> register(
            @PathVariable UUID eventId,
            @RequestBody(required = false) RegisterRequest request
    ) {
        String userId = SecurityUtils.getCurrentUserId();
        TicketDto ticket = registrationService.registerForEvent(eventId, request, userId);
        return new ResponseEntity<>(ApiResponse.success("Registration successful", ticket), HttpStatus.CREATED);
    }

    @GetMapping("/registrations/my-tickets")
    @Operation(summary = "Get user passes / tickets", description = "Returns all event tickets registered by current user")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getMyTickets() {
        String userId = SecurityUtils.getCurrentUserId();
        List<TicketDto> tickets = registrationService.getMyTickets(userId);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    @GetMapping("/registrations/event/{eventId}/attendees")
    @Operation(summary = "Get event attendee roster", description = "Requires event organizer or super admin privileges")
    public ResponseEntity<ApiResponse<List<AttendeeDto>>> getEventAttendees(@PathVariable UUID eventId) {
        String userId = SecurityUtils.getCurrentUserId();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();
        List<AttendeeDto> attendees = registrationService.getEventAttendees(eventId, userId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success(attendees));
    }

    @DeleteMapping("/registrations/{registrationId}")
    @Operation(summary = "Cancel registration", description = "Cancels a ticket registration")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(@PathVariable UUID registrationId) {
        String userId = SecurityUtils.getCurrentUserId();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();
        registrationService.cancelRegistration(registrationId, userId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success("Registration cancelled successfully", null));
    }
}
