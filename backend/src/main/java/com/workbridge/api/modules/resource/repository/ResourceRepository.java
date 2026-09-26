package com.workbridge.api.modules.resource.repository;

import com.workbridge.api.modules.resource.entity.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<ProjectResource, Long> {

    List<ProjectResource> findAllByProjectId(Long projectId);

    List<ProjectResource> findAllByUploadedById(Long userId);

    void deleteAllByProjectId(Long projectId);
}