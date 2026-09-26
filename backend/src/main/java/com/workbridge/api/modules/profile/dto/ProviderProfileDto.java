package com.workbridge.api.modules.profile.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProviderProfileDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpsertRequest {
        @Size(max = 150, message = "Title must not exceed 150 characters")
        private String title;

        private String bio;

        @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be greater than 0")
        private BigDecimal hourlyRate;

        private List<String> skills;

        @Size(max = 100, message = "Location must not exceed 100 characters")
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioItemRequest {
        private String title;
        private String description;
        private String projectUrl;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioItemResponse {
        private Long id;
        private String title;
        private String description;
        private String projectUrl;
        private String imageUrl;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long userId;
        private String userFullName;
        private String userEmail;
        private String title;
        private String bio;
        private BigDecimal hourlyRate;
        private List<String> skills;
        private String location;
        private Double averageRating;
        private Integer completedProjectsCount;
        private List<PortfolioItemResponse> portfolioItems;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}