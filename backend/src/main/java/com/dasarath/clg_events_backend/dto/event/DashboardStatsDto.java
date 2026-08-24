package com.dasarath.clg_events_backend.dto.event;

public record DashboardStatsDto(
    long totalEvents,
    long totalRegistrations,
    long pendingEvents,
    long approvedEvents
) {}
