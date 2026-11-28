package com.expensio.backend.friends.controller;

import com.expensio.backend.friends.dto.*;
import com.expensio.backend.friends.service.GuestService;
import com.expensio.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/friends/guests")
public class GuestController {

    private final GuestService guestService;

    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    @GetMapping
    public ResponseEntity<GuestListResponse> listGuests(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(guestService.listGuests(principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<GuestCreatedResponse> createGuest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGuestRequest request) {

        GuestCreatedResponse response = guestService.createGuest(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{guestId}")
    public ResponseEntity<GuestSummaryDto> updateGuestName(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("guestId") UUID guestId,
            @Valid @RequestBody UpdateGuestNameRequest request) {

        return ResponseEntity.ok(guestService.updateGuestName(principal.getUserId(), guestId, request));
    }

    @PatchMapping("/{guestId}/avatar")
    public ResponseEntity<GuestSummaryDto> updateGuestAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("guestId") UUID guestId,
            @Valid @RequestBody UpdateGuestAvatarRequest request) {

        return ResponseEntity.ok(guestService.updateGuestAvatar(principal.getUserId(), guestId, request));
    }

    @DeleteMapping("/{guestId}")
    public ResponseEntity<Void> retireGuest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("guestId") UUID guestId) {

        guestService.retireGuest(principal.getUserId(), guestId);
        return ResponseEntity.noContent().build();
    }
}
