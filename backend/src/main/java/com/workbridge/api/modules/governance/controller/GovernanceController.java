package com.workbridge.api.modules.governance.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.governance.dto.AdminMetricsDto;
import com.workbridge.api.modules.governance.dto.ReportDto;
import com.workbridge.api.modules.governance.dto.ReviewDto;
import com.workbridge.api.modules.governance.entity.PlatformReport;
import com.workbridge.api.modules.governance.service.GovernanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/governance")
@RequiredArgsConstructor
public class GovernanceController {

    private final GovernanceService governanceService;

    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<ReportDto.Response>> fileReport(
            @Valid @RequestBody ReportDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReportDto.Response response = governanceService.fileReport(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Report submitted successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReportDto.Response>>> getAllReports(
            @RequestParam(required = false) PlatformReport.ReportStatus status
    ) {
        List<ReportDto.Response> reports = governanceService.getAllReports(status);
        return ResponseEntity.ok(ApiResponse.ok("Reports retrieved successfully", reports));
    }

    @PatchMapping("/reports/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportDto.Response>> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportDto.StatusUpdateRequest request
    ) {
        ReportDto.Response response = governanceService.updateReportStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Report status updated successfully", response));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ApiResponse<ReviewDto.Response>> submitReview(
            @Valid @RequestBody ReviewDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReviewDto.Response response = governanceService.submitReview(request, userDetails.getUsername());
        return new ResponseEntity<>(ApiResponse.ok("Review submitted successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/reviews/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReviewDto.Response>>> getUserReviews(@PathVariable Long userId) {
        List<ReviewDto.Response> reviews = governanceService.getUserReviews(userId);
        return ResponseEntity.ok(ApiResponse.ok("Reviews retrieved successfully", reviews));
    }

    @GetMapping("/admin/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminMetricsDto>> getPlatformMetrics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AdminMetricsDto metrics = governanceService.getPlatformMetrics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Platform metrics retrieved successfully", metrics));
    }
}