package com.workbridge.api.modules.project.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.project.dto.ProjectCreateRequest;
import com.workbridge.api.modules.project.dto.ProjectInvitationDto;
import com.workbridge.api.modules.project.dto.ProjectResponse;
import com.workbridge.api.modules.project.entity.ProjectStage;
import com.workbridge.api.modules.project.entity.ProjectUpdate;
import com.workbridge.api.modules.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProjectResponse response = projectService.createProject(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Project created successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<ProjectResponse>> createAndInvite(
            @Valid @RequestBody ProjectCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProjectResponse response = projectService.createProject(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Project created and invitation sent", response), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllOpenProjects() {
        List<ProjectResponse> projects = projectService.getAllOpenProjects();
        return ResponseEntity.ok(ApiResponse.ok("Open projects retrieved successfully", projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(@PathVariable Long id) {
        ProjectResponse response = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.ok("Project retrieved successfully", response));
    }

    @GetMapping("/client")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getClientProjects(
            @RequestParam(required = false, defaultValue = "ALL") String stage,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProjectResponse> projects = projectService.getClientProjects(userDetails.getUsername(), stage);
        return ResponseEntity.ok(ApiResponse.ok("Client projects retrieved successfully", projects));
    }

    @GetMapping("/provider")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProviderProjects(
            @RequestParam(required = false, defaultValue = "ALL") String stage,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProjectResponse> projects = projectService.getProviderProjects(userDetails.getUsername(), stage);
        return ResponseEntity.ok(ApiResponse.ok("Provider projects retrieved successfully", projects));
    }

    @GetMapping("/provider/invitations")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProviderInvitations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProjectResponse> invitations = projectService.getProviderInvitations(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider invitations retrieved successfully", invitations));
    }

    @PostMapping("/{id}/invitation")
    public ResponseEntity<ApiResponse<ProjectResponse>> respondToInvitation(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String action = payload.getOrDefault("action", "ACCEPT");
        ProjectResponse response = projectService.respondToInvitation(id, action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Invitation responded to successfully", response));
    }

    @PutMapping("/{id}/stage")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProjectStage(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String stageStr = payload.get("stage");
        ProjectStage stage = ProjectStage.valueOf(stageStr);
        ProjectResponse response = projectService.updateProjectStage(id, stage, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Project stage updated successfully", response));
    }

    @GetMapping("/{id}/updates")
    public ResponseEntity<ApiResponse<List<ProjectUpdate>>> getProjectUpdates(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProjectUpdate> updates = projectService.getProjectUpdates(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Project updates retrieved successfully", updates));
    }

    @PostMapping("/{id}/updates")
    public ResponseEntity<ApiResponse<ProjectUpdate>> postProjectUpdate(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String title = payload.getOrDefault("title", "Project Progress Update");
        String content = payload.getOrDefault("content", payload.getOrDefault("completedText", "Update submitted"));
        ProjectUpdate update = projectService.postProjectUpdate(id, title, content, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Project update posted successfully", update), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable Long id,
            @Valid @RequestBody ProjectInvitationDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        projectService.addMemberToProject(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Member added successfully", null));
    }
}