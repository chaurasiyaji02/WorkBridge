package com.workbridge.api.modules.profile.repository;

import com.workbridge.api.modules.profile.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByUserId(Long userId);

    Optional<ClientProfile> findByUserEmail(String email);

    boolean existsByUserId(Long userId);
}