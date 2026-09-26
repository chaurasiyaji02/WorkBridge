package com.workbridge.api.modules.workspace.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workspace_chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(length = 500)
    private String attachmentUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isRead = false;
}