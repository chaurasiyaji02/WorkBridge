package com.workbridge.api.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {

    private String result;
    private List<String> suggestions;
    private Double confidenceScore;
    
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();
}