package com.dasarath.clg_events_backend.dto.auth;

import com.dasarath.clg_events_backend.enums.Role;

public record UserProfileDto(
    String id,
    String email,
    String displayName,
    String photoUrl,
    Role role
) {}
