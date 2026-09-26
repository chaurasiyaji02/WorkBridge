package com.workbridge.api.modules.agreement.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.agreement.dto.AgreementActionDto;
import com.workbridge.api.modules.agreement.dto.AgreementCreateDto;
import com.workbridge.api.modules.agreement.dto.AgreementResponse;
import com.workbridge.api.modules.agreement.dto.AgreementSignRequest;
import com.workbridge.api.modules.agreement.service.AgreementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agreements")
@RequiredArgsConstructor
public class AgreementController {

    private final AgreementService agreementService;

    @PostMapping
    public ResponseEntity<ApiResponse<AgreementResponse>> createAgreement(
            @Valid @RequestBody AgreementCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AgreementResponse response = agreementService.createAgreement(dto, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Agreement created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AgreementResponse>> getAgreementById(@PathVariable Long id) {
        AgreementResponse response = agreementService.getAgreementById(id);
        return ResponseEntity.ok(ApiResponse.ok("Agreement retrieved successfully", response));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<AgreementResponse>> getAgreementByProjectId(@PathVariable Long projectId) {
        AgreementResponse response = agreementService.getAgreementByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.ok("Project agreement retrieved successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<AgreementResponse>>> getMyAgreements(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<AgreementResponse> response = agreementService.getMyAgreements(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User agreements retrieved successfully", response));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<ApiResponse<AgreementResponse>> signAgreement(
            @PathVariable Long id,
            @Valid @RequestBody AgreementSignRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AgreementResponse response = agreementService.signAgreement(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Agreement signed successfully", response));
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<ApiResponse<AgreementResponse>> handleAction(
            @PathVariable Long id,
            @Valid @RequestBody AgreementActionDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AgreementResponse response = agreementService.handleAction(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Agreement updated successfully", response));
    }
}