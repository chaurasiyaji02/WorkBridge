package com.workbridge.api.modules.project.repository;

import com.workbridge.api.modules.project.entity.ProjectUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, Long> {

    List<ProjectUpdate> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<ProjectUpdate> findAllByAuthorId(Long authorId);
}