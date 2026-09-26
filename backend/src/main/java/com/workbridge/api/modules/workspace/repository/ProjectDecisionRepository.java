package com.workbridge.api.modules.workspace.repository;

import com.workbridge.api.modules.workspace.entity.ProjectDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDecisionRepository extends JpaRepository<ProjectDecision, Long> {

    List<ProjectDecision> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
}