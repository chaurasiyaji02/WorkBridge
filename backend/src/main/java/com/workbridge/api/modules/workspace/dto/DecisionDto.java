package com.workbridge.api.modules.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class DecisionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotNull(message = "Project ID is required")
        private Long projectId;

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        private String title;

        private String context;

        private String outcome;

        private String summary;

        private String status;

        public String getResolvedContext() {
            if (context != null && !context.isBlank()) return context;
            if (summary != null && !summary.isBlank()) return summary;
            return "Project Discussion Consensus";
        }

        public String getResolvedOutcome() {
            if (outcome != null && !outcome.isBlank()) return outcome;
            if (summary != null && !summary.isBlank()) return summary;
            return "Adopted and Ratified";
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private Long recordedById;
        private String recordedByName;
        private String title;
        private String context;
        private String outcome;
        private String status;
        private LocalDateTime createdAt;
    }
}