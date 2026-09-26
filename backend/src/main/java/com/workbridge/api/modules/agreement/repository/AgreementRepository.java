package com.workbridge.api.modules.agreement.repository;

import com.workbridge.api.modules.agreement.entity.Agreement;
import com.workbridge.api.modules.agreement.entity.AgreementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgreementRepository extends JpaRepository<Agreement, Long> {

    Optional<Agreement> findByProjectId(Long projectId);

    List<Agreement> findAllByClientId(Long clientId);

    List<Agreement> findAllByProviderId(Long providerId);

    List<Agreement> findAllByStatus(AgreementStatus status);

    boolean existsByProjectId(Long projectId);
}