package com.workbridge.api.modules.workspace.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.workspace.dto.DecisionDto;
import com.workbridge.api.modules.workspace.dto.MessageDto;
import com.workbridge.api.modules.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    // --- Chat Endpoints ---

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageDto.Response>> sendMessage(
            @Valid @RequestBody MessageDto.Request request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MessageDto.Response response = workspaceService.sendMessage(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Message sent successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/projects/{projectId}/messages")
    public ResponseEntity<ApiResponse<List<MessageDto.Response>>> getProjectMessages(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<MessageDto.Response> messages = workspaceService.getProjectMessages(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Messages retrieved successfully", messages));
    }

    @PatchMapping("/projects/{projectId}/messages/read")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        workspaceService.markMessagesAsRead(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Messages marked as read", null));
    }

    // --- Decision Endpoints ---

    @PostMapping("/decisions")
    public ResponseEntity<ApiResponse<DecisionDto.Response>> recordDecision(
            @Valid @RequestBody DecisionDto.Request request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DecisionDto.Response response = workspaceService.recordDecision(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Decision recorded successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/projects/{projectId}/decisions")
    public ResponseEntity<ApiResponse<List<DecisionDto.Response>>> getProjectDecisions(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<DecisionDto.Response> decisions = workspaceService.getProjectDecisions(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Decisions retrieved successfully", decisions));
    }
}