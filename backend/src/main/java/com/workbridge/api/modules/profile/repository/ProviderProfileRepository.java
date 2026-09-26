package com.workbridge.api.modules.profile.repository;

import com.workbridge.api.modules.profile.entity.ProviderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

    Optional<ProviderProfile> findByUserId(Long userId);

    Optional<ProviderProfile> findByUserEmail(String email);

    boolean existsByUserId(Long userId);

    @Query("SELECT DISTINCT p FROM ProviderProfile p " +
           "LEFT JOIN p.skills s " +
           "WHERE (:skill IS NULL OR LOWER(s) LIKE LOWER(CONCAT('%', :skill, '%'))) " +
           "AND (:minRate IS NULL OR p.hourlyRate >= :minRate) " +
           "AND (:maxRate IS NULL OR p.hourlyRate <= :maxRate) " +
           "AND (:location IS NULL OR LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<ProviderProfile> searchProviders(
            @Param("skill") String skill,
            @Param("minRate") BigDecimal minRate,
            @Param("maxRate") BigDecimal maxRate,
            @Param("location") String location
    );
}