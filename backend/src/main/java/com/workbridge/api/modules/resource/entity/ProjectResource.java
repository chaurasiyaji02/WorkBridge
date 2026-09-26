package com.workbridge.api.modules.resource.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResource extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private User uploadedBy;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 500)
    private String fileStoragePath;

    @Column(length = 100)
    private String fileType;

    @Column(nullable = false)
    private Long fileSize; // size in bytes

    @Column(length = 255)
    private String description;
}