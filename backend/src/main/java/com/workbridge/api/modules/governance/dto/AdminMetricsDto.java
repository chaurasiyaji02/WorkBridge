package com.workbridge.api.modules.governance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMetricsDto {

    private long totalUsers;
    private long totalProjects;
    private long activeAgreements;
    private long pendingReports;
    private long resolvedReports;
    private Double platformAverageRating;
}