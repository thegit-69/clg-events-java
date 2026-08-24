package com.dasarath.clg_events_backend.dto.common;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    Map<String, String> validationErrors,
    Instant timestamp
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(status, error, message, path, null, Instant.now());
    }

    public static ErrorResponse validation(int status, String error, String message, String path, Map<String, String> validationErrors) {
        return new ErrorResponse(status, error, message, path, validationErrors, Instant.now());
    }
}
