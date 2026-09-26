package com.workbridge.api.modules.requirement.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "requirement_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonBackReference
    private RequirementDocument document;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(length = 255)
    private String changeSummary;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;
}