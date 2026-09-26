package com.workbridge.api.modules.governance.service;

import com.workbridge.api.common.exception.InvalidOperationException;
import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.agreement.entity.AgreementStatus;
import com.workbridge.api.modules.agreement.repository.AgreementRepository;
import com.workbridge.api.modules.auth.entity.Role;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.governance.dto.AdminMetricsDto;
import com.workbridge.api.modules.governance.dto.ReportDto;
import com.workbridge.api.modules.governance.dto.ReviewDto;
import com.workbridge.api.modules.governance.entity.PlatformReport;
import com.workbridge.api.modules.governance.entity.Review;
import com.workbridge.api.modules.governance.repository.ReportRepository;
import com.workbridge.api.modules.governance.repository.ReviewRepository;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.entity.ProjectStage;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GovernanceService {

    private final ReportRepository reportRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AgreementRepository agreementRepository;

    @Transactional
    public ReportDto.Response fileReport(ReportDto.CreateRequest request, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reporterEmail));

        PlatformReport report = PlatformReport.builder()
                .reporter(reporter)
                .targetType(request.getTargetType().toUpperCase())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .details(request.getDetails())
                .status(PlatformReport.ReportStatus.PENDING)
                .build();

        PlatformReport saved = reportRepository.save(report);
        return mapToReportResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportDto.Response> getAllReports(PlatformReport.ReportStatus status) {
        List<PlatformReport> reports = (status != null)
                ? reportRepository.findAllByStatus(status)
                : reportRepository.findAll();

        return reports.stream()
                .map(this::mapToReportResponse)
                .toList();
    }

    @Transactional
    public ReportDto.Response updateReportStatus(Long reportId, ReportDto.StatusUpdateRequest request) {
        PlatformReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        report.setStatus(request.getStatus());
        if (request.getAdminNotes() != null) {
            report.setAdminNotes(request.getAdminNotes());
        }

        PlatformReport updated = reportRepository.save(report);
        return mapToReportResponse(updated);
    }

    @Transactional
    public ReviewDto.Response submitReview(ReviewDto.CreateRequest request, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reviewerEmail));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        if (project.getStage() != ProjectStage.COMPLETED) {
            throw new InvalidOperationException("Reviews can only be submitted after project completion");
        }

        boolean isClient = project.getClient().getId().equals(reviewer.getId());
        boolean isProvider = project.getAssignedProvider() != null && project.getAssignedProvider().getId().equals(reviewer.getId());

        if (!isClient && !isProvider) {
            throw new UnauthorizedException("Only project participants can submit a review");
        }

        if (reviewRepository.existsByProjectIdAndReviewerId(project.getId(), reviewer.getId())) {
            throw new InvalidOperationException("You have already reviewed this project");
        }

        User reviewee = userRepository.findById(request.getRevieweeId())
                .orElseThrow(() -> new ResourceNotFoundException("Reviewee not found with id: " + request.getRevieweeId()));

        Review review = Review.builder()
                .project(project)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return mapToReviewResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto.Response> getUserReviews(Long userId) {
        return reviewRepository.findAllByRevieweeId(userId).stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminMetricsDto getPlatformMetrics(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + adminEmail));

        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can access platform metrics");
        }

        return AdminMetricsDto.builder()
                .totalUsers(userRepository.count())
                .totalProjects(projectRepository.count())
                .activeAgreements(agreementRepository.findAllByStatus(AgreementStatus.ACTIVE).size())
                .pendingReports(reportRepository.countByStatus(PlatformReport.ReportStatus.PENDING))
                .resolvedReports(reportRepository.countByStatus(PlatformReport.ReportStatus.RESOLVED))
                .platformAverageRating(0.0) // placeholder or custom query across all reviews
                .build();
    }

    private ReportDto.Response mapToReportResponse(PlatformReport report) {
        return ReportDto.Response.builder()
                .id(report.getId())
                .reporterId(report.getReporter().getId())
                .reporterEmail(report.getReporter().getEmail())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus())
                .adminNotes(report.getAdminNotes())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private ReviewDto.Response mapToReviewResponse(Review review) {
        return ReviewDto.Response.builder()
                .id(review.getId())
                .projectId(review.getProject().getId())
                .projectTitle(review.getProject().getTitle())
                .reviewerId(review.getReviewer().getId())
                .reviewerName(review.getReviewer().getFullName())
                .revieweeId(review.getReviewee().getId())
                .revieweeName(review.getReviewee().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}