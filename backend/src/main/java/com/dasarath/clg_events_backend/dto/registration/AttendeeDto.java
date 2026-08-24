package com.dasarath.clg_events_backend.dto.registration;

import java.time.Instant;
import java.util.UUID;

public record AttendeeDto(
    UUID id,
    String userId,
    String name,
    String email,
    boolean attended,
    Instant attendedAt
) {}
