package com.workbridge.api.modules.ai.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.ai.dto.*;
import com.workbridge.api.modules.ai.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<AiAnalysisResponseDto>> analyze(
            @Valid @RequestBody AiAnalysisRequestDto request
    ) {
        AiAnalysisResponseDto response = aiService.analyzeContent(request);
        return ResponseEntity.ok(ApiResponse.ok("Content analyzed successfully", response));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<AiResponse>> summarize(
            @Valid @RequestBody AiSummaryRequestDto request
    ) {
        AiResponse response = aiService.summarizeText(request);
        return ResponseEntity.ok(ApiResponse.ok("Content summarized successfully", response));
    }

    @PostMapping("/audit-agreement")
    public ResponseEntity<ApiResponse<AiResponse>> auditAgreement(
            @Valid @RequestBody AiAuditRequest request
    ) {
        AiResponse response = aiService.auditAgreement(request);
        return ResponseEntity.ok(ApiResponse.ok("Agreement audited successfully", response));
    }
}