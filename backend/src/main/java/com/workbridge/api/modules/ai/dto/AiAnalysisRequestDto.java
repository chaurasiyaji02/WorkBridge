package com.workbridge.api.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisRequestDto {

    @NotBlank(message = "Prompt or text for analysis is required")
    private String content;

    private String contextType; // e.g. "PROJECT_DESCRIPTION", "AGREEMENT_TERMS", "DISPUTE_REASON"
}