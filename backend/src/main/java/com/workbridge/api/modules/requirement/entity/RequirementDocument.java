package com.workbridge.api.modules.requirement.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "requirement_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementDocument extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String currentContent;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentVersionNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private LockStatus lockStatus = LockStatus.DRAFT;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @OrderBy("versionNumber DESC")
    @Builder.Default
    private List<RequirementVersion> versions = new ArrayList<>();
}