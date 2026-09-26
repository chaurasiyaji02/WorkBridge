package com.workbridge.api.modules.profile.controller;

import com.workbridge.api.common.ApiResponse;
import com.workbridge.api.modules.profile.dto.ClientProfileDto;
import com.workbridge.api.modules.profile.dto.ProviderProfileDto;
import com.workbridge.api.modules.profile.dto.ProviderSearchCriteria;
import com.workbridge.api.modules.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // --- Client Profile Endpoints ---

    @PutMapping("/client")
    public ResponseEntity<ApiResponse<ClientProfileDto.Response>> upsertClientProfile(
            @Valid @RequestBody ClientProfileDto.UpsertRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ClientProfileDto.Response response = profileService.upsertClientProfile(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Client profile updated successfully", response));
    }

    @GetMapping("/client/me")
    public ResponseEntity<ApiResponse<ClientProfileDto.Response>> getMyClientProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ClientProfileDto.Response response = profileService.getClientProfileByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Client profile retrieved successfully", response));
    }

    @GetMapping("/client/{userId}")
    public ResponseEntity<ApiResponse<ClientProfileDto.Response>> getClientProfileByUserId(@PathVariable Long userId) {
        ClientProfileDto.Response response = profileService.getClientProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok("Client profile retrieved successfully", response));
    }

    // --- Provider Profile Endpoints ---

    @PutMapping("/provider")
    public ResponseEntity<ApiResponse<ProviderProfileDto.Response>> upsertProviderProfile(
            @Valid @RequestBody ProviderProfileDto.UpsertRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProviderProfileDto.Response response = profileService.upsertProviderProfile(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider profile updated successfully", response));
    }

    @GetMapping("/provider/me")
    public ResponseEntity<ApiResponse<ProviderProfileDto.Response>> getMyProviderProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProviderProfileDto.Response response = profileService.getProviderProfileByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider profile retrieved successfully", response));
    }

    @GetMapping("/provider/{userId}")
    public ResponseEntity<ApiResponse<ProviderProfileDto.Response>> getProviderProfileByUserId(@PathVariable Long userId) {
        ProviderProfileDto.Response response = profileService.getProviderProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok("Provider profile retrieved successfully", response));
    }

    @GetMapping("/providers/search")
    public ResponseEntity<ApiResponse<List<ProviderProfileDto.Response>>> searchProviders(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) BigDecimal minRate,
            @RequestParam(required = false) BigDecimal maxRate,
            @RequestParam(required = false) String location
    ) {
        ProviderSearchCriteria criteria = ProviderSearchCriteria.builder()
                .skill(skill)
                .minRate(minRate)
                .maxRate(maxRate)
                .location(location)
                .build();

        List<ProviderProfileDto.Response> results = profileService.searchProviders(criteria);
        return ResponseEntity.ok(ApiResponse.ok("Providers retrieved successfully", results));
    }

    // --- Portfolio Endpoints ---

    @PostMapping("/provider/portfolio")
    public ResponseEntity<ApiResponse<ProviderProfileDto.Response>> addPortfolioItem(
            @Valid @RequestBody ProviderProfileDto.PortfolioItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProviderProfileDto.Response response = profileService.addPortfolioItem(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Portfolio item added successfully", response));
    }

    @DeleteMapping("/provider/portfolio/{itemId}")
    public ResponseEntity<ApiResponse<ProviderProfileDto.Response>> removePortfolioItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProviderProfileDto.Response response = profileService.removePortfolioItem(itemId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Portfolio item removed successfully", response));
    }
}