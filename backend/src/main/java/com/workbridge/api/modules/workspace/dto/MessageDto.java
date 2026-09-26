package com.workbridge.api.modules.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MessageDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotNull(message = "Project ID is required")
        private Long projectId;

        @NotBlank(message = "Message content cannot be blank")
        private String content;

        private String attachmentUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long projectId;
        private Long senderId;
        private String senderName;
        private String senderEmail;
        private String content;
        private String attachmentUrl;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }
}