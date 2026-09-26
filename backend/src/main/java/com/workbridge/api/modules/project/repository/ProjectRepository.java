package com.workbridge.api.modules.project.repository;

import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.entity.ProjectStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByClient(User client);

    List<Project> findAllByAssignedProvider(User assignedProvider);

    List<Project> findAllByStage(ProjectStage stage);

    List<Project> findAllByClientIdOrderByCreatedAtDesc(Long clientId);
}