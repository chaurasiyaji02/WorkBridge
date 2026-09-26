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
public class AiSummaryRequestDto {

    @NotBlank(message = "Text to summarize cannot be blank")
    private String text;

    private Integer maxTokens;
}