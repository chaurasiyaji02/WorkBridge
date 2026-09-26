package com.workbridge.api.modules.workspace.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workspace_project_decisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDecision extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_id", nullable = false)
    private User recordedBy;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String context;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String outcome;

    @Column(length = 50)
    @Builder.Default
    private String status = "RECORDED"; // RECORDED, SUPERSEDED, CANCELLED
}