package com.workbridge.api.modules.requirement.service;

import com.workbridge.api.common.exception.InvalidOperationException;
import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import com.workbridge.api.modules.requirement.dto.ChangeRequestDto;
import com.workbridge.api.modules.requirement.dto.RequirementDraftDto;
import com.workbridge.api.modules.requirement.dto.RequirementResponseDto;
import com.workbridge.api.modules.requirement.entity.LockStatus;
import com.workbridge.api.modules.requirement.entity.RequirementDocument;
import com.workbridge.api.modules.requirement.entity.RequirementVersion;
import com.workbridge.api.modules.requirement.repository.RequirementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RequirementService {

    private final RequirementRepository requirementRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public RequirementResponseDto saveDraft(RequirementDraftDto request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        validateParticipant(project, user);

        RequirementDocument document = requirementRepository.findByProjectId(project.getId())
                .orElseGet(() -> RequirementDocument.builder()
                        .project(project)
                        .title(request.getTitle())
                        .currentContent(request.getContent())
                        .currentVersionNumber(1)
                        .lockStatus(LockStatus.DRAFT)
                        .versions(new ArrayList<>())
                        .build());

        if (document.getLockStatus() == LockStatus.LOCKED) {
            throw new InvalidOperationException("Requirement document is locked. Submit a change request to modify.");
        }

        if (document.getId() != null) {
            document.setCurrentVersionNumber(document.getCurrentVersionNumber() + 1);
            document.setCurrentContent(request.getContent());
            document.setTitle(request.getTitle());
        }

        RequirementVersion version = RequirementVersion.builder()
                .document(document)
                .versionNumber(document.getCurrentVersionNumber())
                .content(request.getContent())
                .changeSummary(request.getChangeSummary() != null ? request.getChangeSummary() : "Draft updated")
                .createdBy(user)
                .build();

        document.getVersions().add(version);
        RequirementDocument saved = requirementRepository.save(document);
        return mapToResponseDto(saved);
    }

    @Transactional
    public RequirementResponseDto requestApproval(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        validateParticipant(project, user);

        RequirementDocument document = requirementRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement document not found for project id: " + projectId));

        if (document.getLockStatus() == LockStatus.LOCKED) {
            throw new InvalidOperationException("Document is already locked.");
        }

        document.setLockStatus(LockStatus.PENDING_APPROVAL);
        RequirementDocument saved = requirementRepository.save(document);
        return mapToResponseDto(saved);
    }

    @Transactional
    public RequirementResponseDto lockRequirements(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Sirf project client hi lock finalize kar sakta hai
        if (!project.getClient().getId().equals(user.getId())) {
            throw new UnauthorizedException("Only the project client can lock requirements.");
        }

        RequirementDocument document = requirementRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement document not found for project id: " + projectId));

        document.setLockStatus(LockStatus.LOCKED);
        RequirementDocument saved = requirementRepository.save(document);
        return mapToResponseDto(saved);
    }

    @Transactional
    public RequirementResponseDto submitChangeRequest(Long projectId, ChangeRequestDto request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        validateParticipant(project, user);

        RequirementDocument document = requirementRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement document not found for project id: " + projectId));

        document.setLockStatus(LockStatus.CHANGE_REQUESTED);

        RequirementVersion changeReqVersion = RequirementVersion.builder()
                .document(document)
                .versionNumber(document.getCurrentVersionNumber() + 1)
                .content(document.getCurrentContent())
                .changeSummary("CHANGE REQUEST: " + request.getReason())
                .createdBy(user)
                .build();

        document.setCurrentVersionNumber(changeReqVersion.getVersionNumber());
        document.getVersions().add(changeReqVersion);

        RequirementDocument saved = requirementRepository.save(document);
        return mapToResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public RequirementResponseDto getRequirementByProjectId(Long projectId) {
        RequirementDocument document = requirementRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement document not found for project id: " + projectId));
        return mapToResponseDto(document);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void validateParticipant(Project project, User user) {
        boolean isClient = project.getClient().getId().equals(user.getId());
        boolean isProvider = project.getAssignedProvider() != null && project.getAssignedProvider().getId().equals(user.getId());

        if (!isClient && !isProvider) {
            throw new UnauthorizedException("You are not authorized to view or edit this requirement document.");
        }
    }

    private RequirementResponseDto mapToResponseDto(RequirementDocument document) {
        List<RequirementResponseDto.VersionDto> versionDtos = document.getVersions() != null
                ? document.getVersions().stream()
                .map(v -> RequirementResponseDto.VersionDto.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .content(v.getContent())
                        .changeSummary(v.getChangeSummary())
                        .createdByUserId(v.getCreatedBy().getId())
                        .createdByName(v.getCreatedBy().getFullName())
                        .createdAt(v.getCreatedAt())
                        .build())
                .toList()
                : new ArrayList<>();

        return RequirementResponseDto.builder()
                .id(document.getId())
                .projectId(document.getProject().getId())
                .projectTitle(document.getProject().getTitle())
                .title(document.getTitle())
                .currentContent(document.getCurrentContent())
                .currentVersionNumber(document.getCurrentVersionNumber())
                .lockStatus(document.getLockStatus())
                .versions(versionDtos)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}