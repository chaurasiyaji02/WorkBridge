package com.workbridge.api.modules.governance.repository;

import com.workbridge.api.modules.governance.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findAllByRevieweeId(Long revieweeId);

    List<Review> findAllByProjectId(Long projectId);

    boolean existsByProjectIdAndReviewerId(Long projectId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double calculateAverageRatingForUser(@Param("userId") Long userId);
}