package com.workbridge.api.modules.resource.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.resource.dto.ResourceResponseDto;
import com.workbridge.api.modules.resource.dto.ResourceUploadDto;
import com.workbridge.api.modules.resource.entity.ProjectResource;
import com.workbridge.api.modules.resource.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ResourceResponseDto>> uploadResource(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute ResourceUploadDto request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ResourceResponseDto response = resourceService.uploadResource(file, request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("File uploaded successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ResourceResponseDto>>> getResourcesByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ResourceResponseDto> resources = resourceService.getResourcesByProject(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Resources retrieved successfully", resources));
    }

    @GetMapping("/download/{resourceId}")
    public ResponseEntity<Resource> downloadResource(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Resource fileResource = resourceService.downloadResource(resourceId, userDetails.getUsername());
        ProjectResource entity = resourceService.getResourceEntity(resourceId);

        String contentType = entity.getFileType() != null ? entity.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + entity.getFileName() + "\"")
                .body(fileResource);
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        resourceService.deleteResource(resourceId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Resource deleted successfully", null));
    }
}