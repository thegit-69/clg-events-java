package com.dasarath.clg_events_backend.dto.attendance;

import java.time.Instant;
import java.util.UUID;

public record AttendanceStatusDto(
    boolean registered,
    UUID registrationId,
    boolean attended,
    Instant attendedAt
) {}
