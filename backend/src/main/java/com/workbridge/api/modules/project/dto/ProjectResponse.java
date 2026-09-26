package com.workbridge.api.modules.project.dto;

import com.workbridge.api.modules.project.entity.ProjectStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal budget;
    private LocalDate deadline;
    private ProjectStage stage;
    private Long clientId;
    private String clientName;
    private Long assignedProviderId;
    private String assignedProviderName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}