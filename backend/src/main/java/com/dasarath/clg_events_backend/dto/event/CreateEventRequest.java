package com.dasarath.clg_events_backend.dto.event;

import com.dasarath.clg_events_backend.enums.EventMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Set;

public record CreateEventRequest(
    @NotBlank(message = "Title is required")
    String title,

    @NotBlank(message = "Type is required")
    String type,

    @NotNull(message = "Mode is required")
    EventMode mode,

    @NotBlank(message = "Description is required")
    String description,

    String venue,
    String banner,

    @NotNull(message = "Start date is required")
    Instant startDate,

    @NotNull(message = "End date is required")
    Instant endDate,

    Instant registrationDeadline,
    Integer maxParticipants,
    Set<String> tags
) {}
