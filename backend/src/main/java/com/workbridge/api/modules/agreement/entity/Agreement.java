package com.workbridge.api.modules.agreement.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agreement extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal agreedAmount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String termsAndConditions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AgreementStatus status = AgreementStatus.PENDING_SIGNATURE;

    @Column(name = "client_signed_at")
    private LocalDateTime clientSignedAt;

    @Column(name = "provider_signed_at")
    private LocalDateTime providerSignedAt;
}