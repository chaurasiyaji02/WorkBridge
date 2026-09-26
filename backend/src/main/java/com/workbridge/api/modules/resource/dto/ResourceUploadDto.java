package com.workbridge.api.modules.resource.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceUploadDto {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
}