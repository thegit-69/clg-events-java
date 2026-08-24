package com.dasarath.clg_events_backend.dto.attendance;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MarkAttendanceRequest(
    @NotNull(message = "Registration ID is required")
    UUID registrationId
) {}
