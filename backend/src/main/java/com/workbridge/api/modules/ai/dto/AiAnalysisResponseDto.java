package com.workbridge.api.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResponseDto {

    private String analysis;
    private List<String> keyPoints;
    private List<String> risks;
    private List<String> recommendations;
}