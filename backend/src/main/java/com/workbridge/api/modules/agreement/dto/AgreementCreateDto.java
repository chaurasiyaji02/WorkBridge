package com.workbridge.api.modules.agreement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementCreateDto {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Provider ID is required")
    private Long providerId;

    @NotNull(message = "Agreed amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    private BigDecimal agreedAmount;

    @NotBlank(message = "Terms and conditions are required")
    private String termsAndConditions;
}