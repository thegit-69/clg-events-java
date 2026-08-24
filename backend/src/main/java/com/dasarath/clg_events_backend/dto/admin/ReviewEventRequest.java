package com.dasarath.clg_events_backend.dto.admin;

import com.dasarath.clg_events_backend.enums.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewEventRequest(
    @NotNull(message = "Approval status is required")
    ApprovalStatus status,

    String rejectionReason
) {}
