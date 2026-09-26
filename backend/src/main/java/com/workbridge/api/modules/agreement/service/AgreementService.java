package com.workbridge.api.modules.agreement.service;

import com.workbridge.api.common.exception.InvalidOperationException;
import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.common.exception.UnauthorizedException;
import com.workbridge.api.modules.agreement.dto.AgreementActionDto;
import com.workbridge.api.modules.agreement.dto.AgreementCreateDto;
import com.workbridge.api.modules.agreement.dto.AgreementResponse;
import com.workbridge.api.modules.agreement.dto.AgreementSignRequest;
import com.workbridge.api.modules.agreement.entity.Agreement;
import com.workbridge.api.modules.agreement.entity.AgreementStatus;
import com.workbridge.api.modules.agreement.repository.AgreementRepository;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.project.entity.Project;
import com.workbridge.api.modules.project.entity.ProjectStage;
import com.workbridge.api.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgreementService {

    private final AgreementRepository agreementRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public AgreementResponse createAgreement(AgreementCreateDto dto, String clientEmail) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + dto.getProjectId()));

        if (!project.getClient().getEmail().equalsIgnoreCase(clientEmail)) {
            throw new UnauthorizedException("Only the project owner can initiate an agreement");
        }

        if (agreementRepository.existsByProjectId(project.getId())) {
            throw new InvalidOperationException("An agreement already exists for this project");
        }

        User provider = userRepository.findById(dto.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + dto.getProviderId()));

        Agreement agreement = Agreement.builder()
                .project(project)
                .client(project.getClient())
                .provider(provider)
                .agreedAmount(dto.getAgreedAmount())
                .termsAndConditions(dto.getTermsAndConditions())
                .status(AgreementStatus.PENDING_SIGNATURE)
                .build();

        Agreement saved = agreementRepository.save(agreement);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public AgreementResponse getAgreementById(Long id) {
        Agreement agreement = agreementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agreement not found with id: " + id));
        return mapToResponse(agreement);
    }

    @Transactional(readOnly = true)
    public AgreementResponse getAgreementByProjectId(Long projectId) {
        Agreement agreement = agreementRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("No agreement found for project id: " + projectId));
        return mapToResponse(agreement);
    }

    @Transactional(readOnly = true)
    public List<AgreementResponse> getMyAgreements(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        List<Agreement> agreements = agreementRepository.findAllByClientId(user.getId());
        agreements.addAll(agreementRepository.findAllByProviderId(user.getId()));

        return agreements.stream()
                .distinct()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AgreementResponse signAgreement(Long agreementId, AgreementSignRequest request, String userEmail) {
        Agreement agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new ResourceNotFoundException("Agreement not found with id: " + agreementId));

        if (agreement.getStatus() != AgreementStatus.PENDING_SIGNATURE) {
            throw new InvalidOperationException("Agreement cannot be signed in its current status: " + agreement.getStatus());
        }

        boolean isClient = agreement.getClient().getEmail().equalsIgnoreCase(userEmail);
        boolean isProvider = agreement.getProvider().getEmail().equalsIgnoreCase(userEmail);

        if (!isClient && !isProvider) {
            throw new UnauthorizedException("You are not authorized to sign this agreement");
        }

        LocalDateTime now = LocalDateTime.now();

        if (isClient) {
            agreement.setClientSignedAt(now);
        }

        if (isProvider) {
            agreement.setProviderSignedAt(now);
        }

        if (agreement.getClientSignedAt() != null && agreement.getProviderSignedAt() != null) {
            agreement.setStatus(AgreementStatus.ACTIVE);

            Project project = agreement.getProject();
            project.setAssignedProvider(agreement.getProvider());
            project.setStage(ProjectStage.IN_PROGRESS);
            projectRepository.save(project);
        }

        Agreement updated = agreementRepository.save(agreement);
        return mapToResponse(updated);
    }

    @Transactional
    public AgreementResponse handleAction(Long agreementId, AgreementActionDto dto, String userEmail) {
        Agreement agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new ResourceNotFoundException("Agreement not found with id: " + agreementId));

        boolean isParticipant = agreement.getClient().getEmail().equalsIgnoreCase(userEmail)
                || agreement.getProvider().getEmail().equalsIgnoreCase(userEmail);

        if (!isParticipant) {
            throw new UnauthorizedException("You are not authorized to modify this agreement");
        }

        String action = dto.getAction().trim().toUpperCase();
        switch (action) {
            case "TERMINATE" -> {
                agreement.setStatus(AgreementStatus.TERMINATED);
                agreement.getProject().setStage(ProjectStage.CANCELLED);
            }
            case "DISPUTE" -> agreement.setStatus(AgreementStatus.DISPUTED);
            case "COMPLETE" -> {
                if (agreement.getStatus() != AgreementStatus.ACTIVE) {
                    throw new InvalidOperationException("Only active agreements can be marked complete");
                }
                agreement.setStatus(AgreementStatus.COMPLETED);
                agreement.getProject().setStage(ProjectStage.COMPLETED);
            }
            default -> throw new InvalidOperationException("Unknown action: " + dto.getAction());
        }

        projectRepository.save(agreement.getProject());
        Agreement updated = agreementRepository.save(agreement);
        return mapToResponse(updated);
    }

    private AgreementResponse mapToResponse(Agreement agreement) {
        return AgreementResponse.builder()
                .id(agreement.getId())
                .projectId(agreement.getProject().getId())
                .projectTitle(agreement.getProject().getTitle())
                .clientId(agreement.getClient().getId())
                .clientName(agreement.getClient().getFullName())
                .providerId(agreement.getProvider().getId())
                .providerName(agreement.getProvider().getFullName())
                .agreedAmount(agreement.getAgreedAmount())
                .termsAndConditions(agreement.getTermsAndConditions())
                .status(agreement.getStatus())
                .clientSignedAt(agreement.getClientSignedAt())
                .providerSignedAt(agreement.getProviderSignedAt())
                .createdAt(agreement.getCreatedAt())
                .updatedAt(agreement.getUpdatedAt())
                .build();
    }
}