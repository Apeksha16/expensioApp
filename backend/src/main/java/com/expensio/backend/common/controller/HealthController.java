package com.expensio.backend.common.controller;

import com.expensio.backend.common.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class HealthController {

    private static final String APP_NAME = "Expensio API";
    private static final String APP_VERSION = "1.0.0";

    @GetMapping({"/api/v1/health", "/api/health"})
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                APP_NAME,
                APP_VERSION,
                Instant.now()
        );
        return ResponseEntity.ok(response);
    }
}
