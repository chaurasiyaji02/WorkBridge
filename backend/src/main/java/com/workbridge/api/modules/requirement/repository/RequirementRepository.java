package com.workbridge.api.modules.requirement.repository;

import com.workbridge.api.modules.requirement.entity.LockStatus;
import com.workbridge.api.modules.requirement.entity.RequirementDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequirementRepository extends JpaRepository<RequirementDocument, Long> {

    Optional<RequirementDocument> findByProjectId(Long projectId);

    boolean existsByProjectId(Long projectId);

    List<RequirementDocument> findAllByLockStatus(LockStatus lockStatus);
}