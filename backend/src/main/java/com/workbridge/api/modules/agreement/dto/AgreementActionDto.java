package com.workbridge.api.modules.agreement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementActionDto {

    @NotBlank(message = "Action is required (e.g. TERMINATE, DISPUTE)")
    private String action;

    private String reason;
}