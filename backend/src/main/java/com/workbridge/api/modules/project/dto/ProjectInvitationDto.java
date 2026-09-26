package com.workbridge.api.modules.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectInvitationDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Role in project is required")
    private String roleInProject;
}