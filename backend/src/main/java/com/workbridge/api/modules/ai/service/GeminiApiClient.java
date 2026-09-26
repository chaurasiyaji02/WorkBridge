package com.workbridge.api.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiApiClient {

    @Value("${gemini.api.key:dummy-key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateContent(String systemInstruction, String userPrompt) {
        if (apiKey == null || apiKey.isBlank() || "dummy-key".equals(apiKey)) {
            log.warn("Gemini API key is not configured. Returning fallback mock response.");
            return "Mock AI response: Gemini API key is missing or not configured.";
        }

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName,
                apiKey
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String combinedPrompt = (systemInstruction != null && !systemInstruction.isBlank())
                    ? systemInstruction + "\n\nUser: " + userPrompt
                    : userPrompt;

            Map<String, Object> textPart = Map.of("text", combinedPrompt);
            Map<String, Object> partsWrapper = Map.of("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = Map.of("contents", Collections.singletonList(partsWrapper));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidateText = rootNode
                        .path("candidates")
                        .get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text");

                if (!candidateText.isMissingNode()) {
                    return candidateText.asText();
                }
            }

            return "Unable to parse AI response.";
        } catch (Exception e) {
            log.error("Error communicating with Gemini API: {}", e.getMessage(), e);
            return "AI service encountered an error while processing request: " + e.getMessage();
        }
    }
}