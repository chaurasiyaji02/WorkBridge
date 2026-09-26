package com.workbridge.api.modules.governance.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.governance.dto.AdminMetricsDto;
import com.workbridge.api.modules.governance.dto.ReportDto;
import com.workbridge.api.modules.governance.entity.PlatformReport;
import com.workbridge.api.modules.governance.service.GovernanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final GovernanceService governanceService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminMetricsDto>> getPlatformMetrics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AdminMetricsDto metrics = governanceService.getPlatformMetrics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Platform metrics retrieved successfully", metrics));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<ReportDto.Response>>> getReports(
            @RequestParam(required = false) PlatformReport.ReportStatus status
    ) {
        List<ReportDto.Response> reports = governanceService.getAllReports(status);
        return ResponseEntity.ok(ApiResponse.ok("Reports retrieved successfully", reports));
    }

    @PatchMapping("/reports/{id}/status")
    public ResponseEntity<ApiResponse<ReportDto.Response>> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportDto.StatusUpdateRequest request
    ) {
        ReportDto.Response response = governanceService.updateReportStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Report status updated successfully", response));
    }
}