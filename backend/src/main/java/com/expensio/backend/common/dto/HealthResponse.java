package com.expensio.backend.common.dto;

import java.time.Instant;

public class HealthResponse {

    private String status;
    private String app;
    private String version;
    private Instant timestamp;

    public HealthResponse() {
    }

    public HealthResponse(String status, String app, String version, Instant timestamp) {
        this.status = status;
        this.app = app;
        this.version = version;
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
