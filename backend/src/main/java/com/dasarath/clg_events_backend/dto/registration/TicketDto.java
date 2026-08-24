package com.dasarath.clg_events_backend.dto.registration;

import com.dasarath.clg_events_backend.dto.event.EventResponseDto;
import java.time.Instant;
import java.util.UUID;

public record TicketDto(
    UUID id,
    UUID eventId,
    String userId,
    String displayName,
    String email,
    boolean attended,
    Instant attendedAt,
    Instant registeredAt,
    EventResponseDto event
) {}
