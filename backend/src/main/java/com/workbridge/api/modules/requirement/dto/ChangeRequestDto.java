package com.workbridge.api.modules.requirement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRequestDto {

    @NotBlank(message = "Reason for change request is required")
    private String reason;

    private String suggestedModifications;
}