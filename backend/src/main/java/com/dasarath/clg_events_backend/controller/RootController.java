package com.dasarath.clg_events_backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Root & Health", description = "Public health check and API overview endpoints")
public class RootController {

    @GetMapping(value = {"/", "/api/v1", "/api/v1/health"})
    @Operation(summary = "API Health Check & Status", description = "Public endpoint providing API status, version, and documentation links")
    public ResponseEntity<Map<String, Object>> getApiStatus() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "status", "UP",
                "application", "CampusEvents Backend API",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "endpoints", Map.of(
                        "publicEvents", "/api/v1/events",
                        "swaggerUi", "/swagger-ui.html",
                        "openApiDocs", "/v3/api-docs",
                        "health", "/api/v1/health"
                )
        ));
    }
}
