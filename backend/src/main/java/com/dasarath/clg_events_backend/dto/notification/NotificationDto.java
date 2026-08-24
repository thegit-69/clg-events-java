package com.dasarath.clg_events_backend.dto.notification;

import com.dasarath.clg_events_backend.enums.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    String title,
    String message,
    NotificationType type,
    boolean read,
    Instant createdAt
) {}
