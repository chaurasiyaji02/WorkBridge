package com.workbridge.api.modules.project.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_members", uniqueConstraints = {
    @UniqueConstraint(name = "uk_project_member", columnNames = {"project_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String roleInProject; // e.g., "LEAD_DEVELOPER", "DESIGNER", "REVIEWER"
}