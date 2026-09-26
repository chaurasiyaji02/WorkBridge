package com.workbridge.api.modules.governance.repository;

import com.workbridge.api.modules.governance.entity.PlatformReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<PlatformReport, Long> {

    List<PlatformReport> findAllByStatus(PlatformReport.ReportStatus status);

    List<PlatformReport> findAllByReporterId(Long reporterId);

    List<PlatformReport> findAllByTargetTypeAndTargetId(String targetType, Long targetId);

    long countByStatus(PlatformReport.ReportStatus status);
}