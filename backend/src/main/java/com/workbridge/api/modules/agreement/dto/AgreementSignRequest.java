package com.workbridge.api.modules.agreement.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementSignRequest {

    @NotNull(message = "Consent status is required")
    @AssertTrue(message = "You must accept and agree to the terms to sign")
    private Boolean agreedToTerms;
}