package com.expensio.backend.friends.push;

import com.expensio.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/devices")
public class DeviceController {

    private final DeviceTokenService deviceTokenService;

    public DeviceController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    @PostMapping
    public ResponseEntity<Void> registerDevice(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RegisterDeviceRequest request) {

        deviceTokenService.registerToken(principal.getUserId(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<Void> removeDevice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("token") String token) {

        deviceTokenService.removeToken(principal.getUserId(), token);
        return ResponseEntity.noContent().build();
    }
}
