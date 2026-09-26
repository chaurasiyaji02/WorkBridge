package com.workbridge.api.modules.resource.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponseDto {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long uploadedById;
    private String uploadedByName;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String description;
    private LocalDateTime createdAt;
}