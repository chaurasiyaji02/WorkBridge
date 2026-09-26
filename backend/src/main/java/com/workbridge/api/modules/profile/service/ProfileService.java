package com.workbridge.api.modules.profile.service;

import com.workbridge.api.common.exception.ResourceNotFoundException;
import com.workbridge.api.modules.auth.entity.User;
import com.workbridge.api.modules.auth.repository.UserRepository;
import com.workbridge.api.modules.profile.dto.ClientProfileDto;
import com.workbridge.api.modules.profile.dto.ProviderProfileDto;
import com.workbridge.api.modules.profile.dto.ProviderSearchCriteria;
import com.workbridge.api.modules.profile.entity.ClientProfile;
import com.workbridge.api.modules.profile.entity.PortfolioItem;
import com.workbridge.api.modules.profile.entity.ProviderProfile;
import com.workbridge.api.modules.profile.repository.ClientProfileRepository;
import com.workbridge.api.modules.profile.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public ClientProfileDto.Response upsertClientProfile(ClientProfileDto.UpsertRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> ClientProfile.builder().user(user).build());

        profile.setCompanyName(request.getCompanyName());
        profile.setWebsite(request.getWebsite());
        profile.setCompanyBio(request.getCompanyBio());
        profile.setIndustry(request.getIndustry());
        profile.setLocation(request.getLocation());

        ClientProfile saved = clientProfileRepository.save(profile);
        return mapToClientResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClientProfileDto.Response getClientProfileByUserEmail(String userEmail) {
        ClientProfile profile = clientProfileRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found for: " + userEmail));
        return mapToClientResponse(profile);
    }

    @Transactional(readOnly = true)
    public ClientProfileDto.Response getClientProfileByUserId(Long userId) {
        ClientProfile profile = clientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found for user id: " + userId));
        return mapToClientResponse(profile);
    }

    @Transactional
    public ProviderProfileDto.Response upsertProviderProfile(ProviderProfileDto.UpsertRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        ProviderProfile profile = providerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> ProviderProfile.builder().user(user).build());

        profile.setTitle(request.getTitle());
        profile.setBio(request.getBio());
        profile.setHourlyRate(request.getHourlyRate());
        if (request.getSkills() != null) {
            profile.setSkills(request.getSkills());
        }
        profile.setLocation(request.getLocation());

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    @Transactional(readOnly = true)
    public ProviderProfileDto.Response getProviderProfileByUserEmail(String userEmail) {
        ProviderProfile profile = providerProfileRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for: " + userEmail));
        return mapToProviderResponse(profile);
    }

    @Transactional(readOnly = true)
    public ProviderProfileDto.Response getProviderProfileByUserId(Long userId) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for user id: " + userId));
        return mapToProviderResponse(profile);
    }

    @Transactional
    public ProviderProfileDto.Response addPortfolioItem(ProviderProfileDto.PortfolioItemRequest request, String userEmail) {
        ProviderProfile profile = providerProfileRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for: " + userEmail));

        PortfolioItem item = PortfolioItem.builder()
                .providerProfile(profile)
                .title(request.getTitle())
                .description(request.getDescription())
                .projectUrl(request.getProjectUrl())
                .imageUrl(request.getImageUrl())
                .build();

        profile.getPortfolioItems().add(item);
        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    @Transactional
    public ProviderProfileDto.Response removePortfolioItem(Long itemId, String userEmail) {
        ProviderProfile profile = providerProfileRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for: " + userEmail));

        profile.getPortfolioItems().removeIf(item -> item.getId().equals(itemId));
        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProviderProfileDto.Response> searchProviders(ProviderSearchCriteria criteria) {
        List<ProviderProfile> profiles = providerProfileRepository.searchProviders(
                criteria.getSkill(),
                criteria.getMinRate(),
                criteria.getMaxRate(),
                criteria.getLocation()
        );

        return profiles.stream()
                .map(this::mapToProviderResponse)
                .toList();
    }

    private ClientProfileDto.Response mapToClientResponse(ClientProfile profile) {
        return ClientProfileDto.Response.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .userFullName(profile.getUser().getFullName())
                .userEmail(profile.getUser().getEmail())
                .companyName(profile.getCompanyName())
                .website(profile.getWebsite())
                .companyBio(profile.getCompanyBio())
                .industry(profile.getIndustry())
                .location(profile.getLocation())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private ProviderProfileDto.Response mapToProviderResponse(ProviderProfile profile) {
        List<ProviderProfileDto.PortfolioItemResponse> portfolioResponses = profile.getPortfolioItems() != null
                ? profile.getPortfolioItems().stream()
                .map(item -> ProviderProfileDto.PortfolioItemResponse.builder()
                        .id(item.getId())
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .projectUrl(item.getProjectUrl())
                        .imageUrl(item.getImageUrl())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList()
                : new ArrayList<>();

        return ProviderProfileDto.Response.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .userFullName(profile.getUser().getFullName())
                .userEmail(profile.getUser().getEmail())
                .title(profile.getTitle())
                .bio(profile.getBio())
                .hourlyRate(profile.getHourlyRate())
                .skills(profile.getSkills())
                .location(profile.getLocation())
                .averageRating(profile.getAverageRating())
                .completedProjectsCount(profile.getCompletedProjectsCount())
                .portfolioItems(portfolioResponses)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}