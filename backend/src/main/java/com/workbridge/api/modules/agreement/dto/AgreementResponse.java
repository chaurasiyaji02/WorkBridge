package com.workbridge.api.modules.agreement.dto;

import com.workbridge.api.modules.agreement.entity.AgreementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementResponse {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long clientId;
    private String clientName;
    private Long providerId;
    private String providerName;
    private BigDecimal agreedAmount;
    private String termsAndConditions;
    private AgreementStatus status;
    private LocalDateTime clientSignedAt;
    private LocalDateTime providerSignedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}