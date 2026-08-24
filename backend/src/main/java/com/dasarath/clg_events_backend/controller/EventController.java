package com.dasarath.clg_events_backend.controller;

import com.dasarath.clg_events_backend.dto.common.ApiResponse;
import com.dasarath.clg_events_backend.dto.event.CreateEventRequest;
import com.dasarath.clg_events_backend.dto.event.DashboardStatsDto;
import com.dasarath.clg_events_backend.dto.event.EventResponseDto;
import com.dasarath.clg_events_backend.dto.event.UpdateEventRequest;
import com.dasarath.clg_events_backend.security.SecurityUtils;
import com.dasarath.clg_events_backend.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@Tag(name = "Events", description = "Public event discovery, creation, updates, and organizer stats")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @Operation(summary = "Discover approved events", description = "Public endpoint with search, category filtering, and pagination")
    public ResponseEntity<ApiResponse<Page<EventResponseDto>>> getEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "startDate,asc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortProp = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProp));

        Page<EventResponseDto> events = eventService.getApprovedEvents(search, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/my-proposals")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current organizer proposals", description = "Returns all event proposals created by the current user")
    public ResponseEntity<ApiResponse<List<EventResponseDto>>> getMyProposals() {
        String userId = SecurityUtils.getCurrentUserId();
        List<EventResponseDto> proposals = eventService.getMyProposals(userId);
        return ResponseEntity.ok(ApiResponse.success(proposals));
    }

    @GetMapping("/dashboard-stats")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get organizer dashboard stats", description = "Returns summary statistics for the organizer's events")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats() {
        String userId = SecurityUtils.getCurrentUserId();
        DashboardStatsDto stats = eventService.getDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID", description = "Returns event details. If pending, requires organizer or admin privileges.")
    public ResponseEntity<ApiResponse<EventResponseDto>> getEventById(@PathVariable UUID id) {
        String currentUserId = SecurityUtils.isAuthenticated() ? SecurityUtils.getCurrentUserId() : null;
        boolean isSuperAdmin = SecurityUtils.isAuthenticated() && SecurityUtils.isSuperAdmin();

        EventResponseDto event = eventService.getEventById(id, currentUserId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a new event proposal", description = "Creates a proposal in PENDING approval status")
    public ResponseEntity<ApiResponse<EventResponseDto>> createEvent(@Valid @RequestBody CreateEventRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        EventResponseDto created = eventService.createEvent(request, userId);
        return new ResponseEntity<>(ApiResponse.success("Event proposal submitted successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update an existing event", description = "Requires event organizer or super admin privileges")
    public ResponseEntity<ApiResponse<EventResponseDto>> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        String userId = SecurityUtils.getCurrentUserId();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();
        EventResponseDto updated = eventService.updateEvent(id, request, userId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete an event", description = "Requires event organizer or super admin privileges")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable UUID id) {
        String userId = SecurityUtils.getCurrentUserId();
        boolean isSuperAdmin = SecurityUtils.isSuperAdmin();
        eventService.deleteEvent(id, userId, isSuperAdmin);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }

    @PostMapping("/{id}/resubmit")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Resubmit a rejected proposal", description = "Resets a rejected proposal to PENDING for re-evaluation")
    public ResponseEntity<ApiResponse<EventResponseDto>> resubmitEvent(@PathVariable UUID id) {
        String userId = SecurityUtils.getCurrentUserId();
        EventResponseDto resubmitted = eventService.resubmitEvent(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Proposal resubmitted for review", resubmitted));
    }
}
