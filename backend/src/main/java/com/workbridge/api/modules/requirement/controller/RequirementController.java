package com.workbridge.api.modules.requirement.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.requirement.dto.ChangeRequestDto;
import com.workbridge.api.modules.requirement.dto.RequirementDraftDto;
import com.workbridge.api.modules.requirement.dto.RequirementResponseDto;
import com.workbridge.api.modules.requirement.service.RequirementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
public class RequirementController {

    private final RequirementService requirementService;

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<RequirementResponseDto>> saveDraft(
            @Valid @RequestBody RequirementDraftDto request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RequirementResponseDto response = requirementService.saveDraft(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Requirement draft saved successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<RequirementResponseDto>> getRequirementByProjectId(
            @PathVariable Long projectId
    ) {
        RequirementResponseDto response = requirementService.getRequirementByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.ok("Requirement document retrieved successfully", response));
    }

    @PostMapping("/project/{projectId}/request-approval")
    public ResponseEntity<ApiResponse<RequirementResponseDto>> requestApproval(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RequirementResponseDto response = requirementService.requestApproval(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Approval requested successfully", response));
    }

    @PostMapping("/project/{projectId}/lock")
    public ResponseEntity<ApiResponse<RequirementResponseDto>> lockRequirements(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RequirementResponseDto response = requirementService.lockRequirements(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Requirement document locked successfully", response));
    }

    @PostMapping("/project/{projectId}/change-request")
    public ResponseEntity<ApiResponse<RequirementResponseDto>> submitChangeRequest(
            @PathVariable Long projectId,
            @Valid @RequestBody ChangeRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RequirementResponseDto response = requirementService.submitChangeRequest(projectId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Change request submitted successfully", response));
    }
}