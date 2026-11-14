package com.expensio.backend.auth.dto;

import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private String phone;
    private String name;
    private String status;

    public UserDto() {
    }

    public UserDto(UUID id, String email, String phone, String name, String status) {
        this.id = id;
        this.email = email;
        this.phone = phone;
        this.name = name;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

