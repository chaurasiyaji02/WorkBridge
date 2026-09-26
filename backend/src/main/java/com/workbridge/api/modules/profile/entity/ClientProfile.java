package com.workbridge.api.modules.profile.entity;

import com.workbridge.api.common.BaseEntity;
import com.workbridge.api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String companyName;

    @Column(length = 255)
    private String website;

    @Column(columnDefinition = "TEXT")
    private String companyBio;

    @Column(length = 100)
    private String industry;

    @Column(length = 100)
    private String location;
}