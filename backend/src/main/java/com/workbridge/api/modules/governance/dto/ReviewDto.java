package com.workbridge.api.modules.governance.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ReviewDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "Project ID is required")
        private Long projectId;

        @NotNull(message = "Reviewee ID is required")
        private Long revieweeId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        private Integer rating;

        private String comment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private Long reviewerId;
        private String reviewerName;
        private Long revieweeId;
        private String revieweeName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}