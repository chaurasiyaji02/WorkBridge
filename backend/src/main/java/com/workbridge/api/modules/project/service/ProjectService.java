package com.workbridge.api.modules.project.service;

import com.workbridge.api.common.exception.InvalidOperationException;
import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.auth.entity.Role;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.project.dto.ProjectCreateRequest;
import com.workbridge.api.modules.project.dto.ProjectInvitationDto;
import com.workbridge.api.modules.project.dto.ProjectResponse;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.entity.ProjectMember;
import com.workbridge.api.modules.project.entity.ProjectStage;
import com.workbridge.api.modules.project.entity.ProjectUpdate;
import com.workbridge.api.modules.project.repository.ProjectMemberRepository;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import com.workbridge.api.modules.project.repository.ProjectUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectUpdateRepository projectUpdateRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, String clientEmail) {
        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + clientEmail));

        if (client.getRole() != Role.CLIENT) {
            throw new UnauthorizedException("Only clients can create projects");
        }

        User provider = null;
        if (request.getAssignedProviderId() != null) {
            provider = userRepository.findById(request.getAssignedProviderId()).orElse(null);
        }

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .budget(request.getBudget())
                .deadline(request.getDeadline())
                .stage(provider != null ? ProjectStage.OPEN : ProjectStage.OPEN)
                .client(client)
                .assignedProvider(provider)
                .build();

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllOpenProjects() {
        return projectRepository.findAllByStage(ProjectStage.OPEN)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getClientProjects(String clientEmail, String stageFilter) {
        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + clientEmail));

        List<Project> projects = projectRepository.findAllByClient(client);
        if (stageFilter != null && !stageFilter.equalsIgnoreCase("ALL")) {
            ProjectStage stage = ProjectStage.valueOf(stageFilter);
            projects = projects.stream().filter(p -> p.getStage() == stage).toList();
        }
        return projects.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProviderProjects(String providerEmail, String stageFilter) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + providerEmail));

        List<Project> projects = projectRepository.findAllByAssignedProvider(provider);
        if (stageFilter != null && !stageFilter.equalsIgnoreCase("ALL")) {
            ProjectStage stage = ProjectStage.valueOf(stageFilter);
            projects = projects.stream().filter(p -> p.getStage() == stage).toList();
        }
        return projects.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProviderInvitations(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + providerEmail));

        return projectRepository.findAllByAssignedProvider(provider).stream()
                .filter(p -> p.getStage() == ProjectStage.OPEN)
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ProjectResponse respondToInvitation(Long projectId, String action, String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + providerEmail));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (!"ACCEPT".equalsIgnoreCase(action)) {
            project.setAssignedProvider(null);
            project.setStage(ProjectStage.OPEN);
        } else {
            project.setAssignedProvider(provider);
            project.setStage(ProjectStage.IN_PROGRESS);
        }

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProjectStage(Long projectId, ProjectStage stage, String userEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isClient = project.getClient().getId().equals(user.getId());
        boolean isProvider = project.getAssignedProvider() != null && project.getAssignedProvider().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isClient && !isProvider && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to update this project's stage");
        }

        project.setStage(stage);
        return mapToResponse(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectUpdate> getProjectUpdates(Long projectId, String userEmail) {
        return projectUpdateRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Transactional
    public ProjectUpdate postProjectUpdate(Long projectId, String title, String content, String userEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        ProjectUpdate update = ProjectUpdate.builder()
                .project(project)
                .author(author)
                .title(title)
                .content(content)
                .build();

        return projectUpdateRepository.save(update);
    }

    @Transactional
    public void addMemberToProject(Long projectId, ProjectInvitationDto dto, String clientEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getClient().getEmail().equalsIgnoreCase(clientEmail)) {
            throw new UnauthorizedException("Only the project owner can invite members");
        }

        User userToInvite = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User to invite not found with id: " + dto.getUserId()));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userToInvite.getId())) {
            throw new InvalidOperationException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(userToInvite)
                .roleInProject(dto.getRoleInProject())
                .build();

        projectMemberRepository.save(member);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .budget(project.getBudget())
                .deadline(project.getDeadline())
                .stage(project.getStage())
                .clientId(project.getClient().getId())
                .clientName(project.getClient().getFullName())
                .assignedProviderId(project.getAssignedProvider() != null ? project.getAssignedProvider().getId() : null)
                .assignedProviderName(project.getAssignedProvider() != null ? project.getAssignedProvider().getFullName() : null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}