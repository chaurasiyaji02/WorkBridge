package com.workbridge.api.modules.requirement.dto;

import com.workbridge.api.modules.requirement.entity.LockStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequirementResponseDto {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private String title;
    private String currentContent;
    private Integer currentVersionNumber;
    private LockStatus lockStatus;
    private List<VersionDto> versions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionDto {
        private Long id;
        private Integer versionNumber;
        private String content;
        private String changeSummary;
        private Long createdByUserId;
        private String createdByName;
        private LocalDateTime createdAt;
    }
}