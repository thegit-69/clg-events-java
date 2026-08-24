package com.dasarath.clg_events_backend.dto.attendance;

import java.time.Instant;
import java.util.UUID;

public record AttendanceEventDto(
    UUID eventId,
    String userId,
    UUID registrationId,
    String displayName,
    boolean attended,
    Instant attendedAt
) {}
