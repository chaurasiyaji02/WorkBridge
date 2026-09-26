package com.workbridge.api.modules.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAuditRequest {

    @NotNull(message = "Agreement ID is required for audit")
    private Long agreementId;

    private String focusArea; // e.g. "PAYMENT_TERMS", "SCOPE_CLARITY", "LIABILITY"
}