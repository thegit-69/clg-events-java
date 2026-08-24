package com.dasarath.clg_events_backend.dto.event;

import com.dasarath.clg_events_backend.enums.EventMode;
import java.time.Instant;
import java.util.Set;

public record UpdateEventRequest(
    String title,
    String type,
    EventMode mode,
    String description,
    String venue,
    String banner,
    Instant startDate,
    Instant endDate,
    Instant registrationDeadline,
    Integer maxParticipants,
    Set<String> tags
) {}
