package com.workbridge.api.modules.ai.service;

import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.modules.agreement.entity.Agreement;
import com.workbridge.api.modules.agreement.repository.AgreementRepository;
import com.workbridge.api.modules.ai.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiApiClient geminiApiClient;
    private final AgreementRepository agreementRepository;

    public AiAnalysisResponseDto analyzeContent(AiAnalysisRequestDto request) {
        String systemInstruction = "You are an expert contract and project risk auditor for a freelance marketplace. " +
                "Analyze the provided text for ambiguity, scope creep, unrealistic timelines, and liability risks. " +
                "Provide a clear assessment.";

        String aiResult = geminiApiClient.generateContent(systemInstruction, request.getContent());

        return AiAnalysisResponseDto.builder()
                .analysis(aiResult)
                .keyPoints(List.of("Scope evaluated against context: " + (request.getContextType() != null ? request.getContextType() : "GENERAL")))
                .risks(Collections.emptyList())
                .recommendations(List.of("Review payment milestones", "Clarify delivery expectations"))
                .build();
    }

    public AiResponse summarizeText(AiSummaryRequestDto request) {
        String systemInstruction = "Summarize the following project or agreement document into concise bullet points and actionable highlights.";
        String summary = geminiApiClient.generateContent(systemInstruction, request.getText());

        return AiResponse.builder()
                .result(summary)
                .confidenceScore(0.95)
                .suggestions(List.of("Verify summary completeness against the full contract"))
                .build();
    }

    public AiResponse auditAgreement(AiAuditRequest request) {
        Agreement agreement = agreementRepository.findById(request.getAgreementId())
                .orElseThrow(() -> new ResourceNotFoundException("Agreement not found with id: " + request.getAgreementId()));

        String prompt = String.format(
                "Audit this agreement:\nProject: %s\nAgreed Amount: %s\nTerms & Conditions:\n%s\nFocus Area: %s",
                agreement.getProject().getTitle(),
                agreement.getAgreedAmount(),
                agreement.getTermsAndConditions(),
                request.getFocusArea() != null ? request.getFocusArea() : "ALL"
        );

        String systemInstruction = "You are an AI legal assistant reviewing a freelance agreement. Flag high-risk clauses, unbalanced terms, or missing deliverables.";
        String auditResult = geminiApiClient.generateContent(systemInstruction, prompt);

        return AiResponse.builder()
                .result(auditResult)
                .confidenceScore(0.92)
                .suggestions(List.of("Check dispute resolution clause", "Verify delivery timeline alignment"))
                .build();
    }
}