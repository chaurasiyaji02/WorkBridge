package com.workbridge.api.modules.profile.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "provider_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String title; // e.g. "Full Stack Spring Boot & React Engineer"

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "provider_skills", joinColumns = @JoinColumn(name = "provider_profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Column(length = 100)
    private String location;

    @Builder.Default
    private Double averageRating = 0.0;

    @Builder.Default
    private Integer completedProjectsCount = 0;

    @OneToMany(mappedBy = "providerProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<PortfolioItem> portfolioItems = new ArrayList<>();
}