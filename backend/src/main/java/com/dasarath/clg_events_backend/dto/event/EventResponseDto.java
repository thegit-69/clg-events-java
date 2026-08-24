package com.dasarath.clg_events_backend.dto.event;

import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import com.dasarath.clg_events_backend.enums.EventMode;
import com.dasarath.clg_events_backend.enums.EventStatus;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record EventResponseDto(
    UUID id,
    String title,
    String type,
    EventMode mode,
    String description,
    String venue,
    String banner,
    String bannerUrl,
    Instant startDate,
    Instant endDate,
    Instant registrationDeadline,
    int maxParticipants,
    long registeredCount,
    EventStatus status,
    ApprovalStatus approvalStatus,
    String organizer,
    String organizerId,
    String rejectionReason,
    Set<String> tags,
    Instant createdAt,
    Instant updatedAt
) {}
