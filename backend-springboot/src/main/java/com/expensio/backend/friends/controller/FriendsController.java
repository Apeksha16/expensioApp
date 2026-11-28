package com.expensio.backend.friends.controller;

import com.expensio.backend.friends.dto.FriendSearchResponse;
import com.expensio.backend.friends.dto.FriendsListResponse;
import com.expensio.backend.friends.dto.FriendshipResponseDto;
import com.expensio.backend.friends.dto.SendFriendRequestDto;
import com.expensio.backend.friends.service.FriendsCommandService;
import com.expensio.backend.friends.service.FriendsReadService;
import com.expensio.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/friends")
public class FriendsController {

    private final FriendsReadService friendsReadService;
    private final FriendsCommandService friendsCommandService;

    public FriendsController(FriendsReadService friendsReadService, FriendsCommandService friendsCommandService) {
        this.friendsReadService = friendsReadService;
        this.friendsCommandService = friendsCommandService;
    }

    @GetMapping
    public ResponseEntity<FriendsListResponse> listFriends(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", required = false) Integer limit) {

        return ResponseEntity.ok(friendsReadService.listFriends(principal.getUserId(), cursor, limit));
    }

    @GetMapping("/search")
    public ResponseEntity<FriendSearchResponse> searchUsers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", required = false) Integer limit) {

        return ResponseEntity.ok(friendsReadService.searchUsers(principal.getUserId(), query, cursor, limit));
    }

    @PostMapping("/requests")
    public ResponseEntity<FriendshipResponseDto> sendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendFriendRequestDto request) {

        FriendshipResponseDto response = friendsCommandService.sendRequest(
                principal.getUserId(),
                request.addresseeId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<FriendshipResponseDto> acceptRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("friendshipId") UUID friendshipId) {

        return ResponseEntity.ok(friendsCommandService.acceptRequest(principal.getUserId(), friendshipId));
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> deleteFriendship(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("friendshipId") UUID friendshipId) {

        friendsCommandService.deleteFriendship(principal.getUserId(), friendshipId);
        return ResponseEntity.noContent().build();
    }
}
