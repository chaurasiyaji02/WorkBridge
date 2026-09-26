package com.workbridge.api.modules.agreement.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "agreement_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgreementVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agreement_id", nullable = false)
    private Agreement agreement;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal proposedAmount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(length = 255)
    private String changeReason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;
}