package com.workbridge.api.modules.profile.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.workbridge.api.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolio_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_profile_id", nullable = false)
    @JsonBackReference
    private ProviderProfile providerProfile;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String projectUrl;

    @Column(length = 500)
    private String imageUrl;
}