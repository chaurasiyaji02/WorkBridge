package com.workbridge.api.modules.resource.service;

import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import com.workbridge.api.modules.resource.dto.ResourceResponseDto;
import com.workbridge.api.modules.resource.dto.ResourceUploadDto;
import com.workbridge.api.modules.resource.entity.ProjectResource;
import com.workbridge.api.modules.resource.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public ResourceResponseDto uploadResource(MultipartFile file, ResourceUploadDto request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        validateProjectAccess(project, user);

        String savedPath = fileStorageService.storeFile(file);

        ProjectResource resource = ProjectResource.builder()
                .project(project)
                .uploadedBy(user)
                .fileName(file.getOriginalFilename())
                .fileStoragePath(savedPath)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .description(request.getDescription())
                .build();

        ProjectResource saved = resourceRepository.save(resource);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDto> getResourcesByProject(Long projectId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        validateProjectAccess(project, user);

        return resourceRepository.findAllByProjectId(projectId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Resource downloadResource(Long resourceId, String userEmail) {
        User user = getUserByEmail(userEmail);
        ProjectResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        validateProjectAccess(resource.getProject(), user);

        return fileStorageService.loadFileAsResource(resource.getFileStoragePath());
    }

    @Transactional(readOnly = true)
    public ProjectResource getResourceEntity(Long resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));
    }

    @Transactional
    public void deleteResource(Long resourceId, String userEmail) {
        User user = getUserByEmail(userEmail);
        ProjectResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        boolean isUploader = resource.getUploadedBy().getId().equals(user.getId());
        boolean isClient = resource.getProject().getClient().getId().equals(user.getId());

        if (!isUploader && !isClient) {
            throw new UnauthorizedException("You are not authorized to delete this resource.");
        }

        fileStorageService.deleteFile(resource.getFileStoragePath());
        resourceRepository.delete(resource);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void validateProjectAccess(Project project, User user) {
        boolean isClient = project.getClient().getId().equals(user.getId());
        boolean isProvider = project.getAssignedProvider() != null && project.getAssignedProvider().getId().equals(user.getId());

        if (!isClient && !isProvider) {
            throw new UnauthorizedException("You do not have permission to access resources for this project.");
        }
    }

    private ResourceResponseDto mapToDto(ProjectResource resource) {
        return ResourceResponseDto.builder()
                .id(resource.getId())
                .projectId(resource.getProject().getId())
                .projectTitle(resource.getProject().getTitle())
                .uploadedById(resource.getUploadedBy().getId())
                .uploadedByName(resource.getUploadedBy().getFullName())
                .fileName(resource.getFileName())
                .fileType(resource.getFileType())
                .fileSize(resource.getFileSize())
                .description(resource.getDescription())
                .createdAt(resource.getCreatedAt())
                .build();
    }
}