package com.workbridge.api.modules.governance.dto;

import com.workbridge.api.modules.governance.entity.PlatformReport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ReportDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Target type is required (e.g., PROJECT, USER, AGREEMENT)")
        private String targetType;

        @NotNull(message = "Target ID is required")
        private Long targetId;

        @NotBlank(message = "Reason is required")
        private String reason;

        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotNull(message = "Report status is required")
        private PlatformReport.ReportStatus status;

        private String adminNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long reporterId;
        private String reporterEmail;
        private String targetType;
        private Long targetId;
        private String reason;
        private String details;
        private PlatformReport.ReportStatus status;
        private String adminNotes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}