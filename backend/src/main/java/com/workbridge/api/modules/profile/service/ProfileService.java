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
import java.util.Arrays;
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
            profile.setSkills(new ArrayList<>(request.getSkills()));
        }
        profile.setLocation(request.getLocation());

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    /**
     * Endpoint support for POST /api/profile/services
     * Allows a Provider to post a new service/gig from mobile or web,
     * immediately persisting it to Neon DB and updating the provider's discoverable profile.
     */
    @Transactional
    public ProviderProfileDto.Response createServiceOffer(ProviderProfileDto.ServiceOfferRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        ProviderProfile profile = providerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> ProviderProfile.builder()
                        .user(user)
                        .averageRating(5.0)
                        .completedProjectsCount(0)
                        .skills(new ArrayList<>())
                        .portfolioItems(new ArrayList<>())
                        .build());

        // Update profile fields with latest service offer details
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            profile.setTitle(request.getTitle());
        }
        if (request.getHourlyRate() != null) {
            profile.setHourlyRate(request.getHourlyRate());
        }
        if (request.getBio() != null && !request.getBio().isBlank()) {
            profile.setBio(request.getBio());
        }

        // Parse comma-separated String skills into List<String>
        if (request.getSkills() != null && !request.getSkills().isBlank()) {
            List<String> parsedSkills = Arrays.stream(request.getSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            profile.setSkills(new ArrayList<>(parsedSkills));
        }

        // Add service entry as an item to portfolio so it is permanently queryable
        PortfolioItem item = PortfolioItem.builder()
                .providerProfile(profile)
                .title(request.getTitle())
                .description(request.getBio() != null ? request.getBio() : request.getCategory())
                .projectUrl(request.getCategory())
                .build();

        if (profile.getPortfolioItems() == null) {
            profile.setPortfolioItems(new ArrayList<>());
        }
        profile.getPortfolioItems().add(item);

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

        if (profile.getPortfolioItems() == null) {
            profile.setPortfolioItems(new ArrayList<>());
        }
        profile.getPortfolioItems().add(item);

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    @Transactional
    public ProviderProfileDto.Response removePortfolioItem(Long itemId, String userEmail) {
        ProviderProfile profile = providerProfileRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for: " + userEmail));

        if (profile.getPortfolioItems() != null) {
            profile.getPortfolioItems().removeIf(item -> item.getId().equals(itemId));
        }

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponse(saved);
    }

    /**
     * Cross-Device Discovery Pipeline:
     * Searches providers in Neon DB. If criteria are empty or repository returns no records,
     * automatically queries registered providers and returns profiles so the Client Explore feed
     * displays real-time database records across devices.
     */
    @Transactional(readOnly = true)
    public List<ProviderProfileDto.Response> searchProviders(ProviderSearchCriteria criteria) {
        List<ProviderProfile> profiles = providerProfileRepository.searchProviders(
                criteria != null ? criteria.getSkill() : null,
                criteria != null ? criteria.getMinRate() : null,
                criteria != null ? criteria.getMaxRate() : null,
                criteria != null ? criteria.getLocation() : null
        );

        if (profiles.isEmpty()) {
            profiles = providerProfileRepository.findAll();
        }

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
                .domain(profile.getUser().getDomain())
                .bio(profile.getBio())
                .hourlyRate(profile.getHourlyRate())
                .skills(profile.getSkills() != null ? profile.getSkills() : new ArrayList<>())
                .location(profile.getLocation())
                .averageRating(profile.getAverageRating() != null ? profile.getAverageRating() : 5.0)
                .completedProjectsCount(profile.getCompletedProjectsCount() != null ? profile.getCompletedProjectsCount() : 0)
                .portfolioItems(portfolioResponses)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}