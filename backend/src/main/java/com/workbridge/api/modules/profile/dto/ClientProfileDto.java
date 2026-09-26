package com.workbridge.api.modules.profile.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ClientProfileDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpsertRequest {
        @Size(max = 150, message = "Company name must not exceed 150 characters")
        private String companyName;

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        private String website;

        private String companyBio;

        @Size(max = 100, message = "Industry must not exceed 100 characters")
        private String industry;

        @Size(max = 100, message = "Location must not exceed 100 characters")
        private String location;
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
        private String companyName;
        private String website;
        private String companyBio;
        private String industry;
        private String location;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}