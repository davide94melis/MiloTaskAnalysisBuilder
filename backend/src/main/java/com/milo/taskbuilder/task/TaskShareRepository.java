package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskShareRepository extends JpaRepository<TaskShareEntity, UUID> {

    List<TaskShareEntity> findByTaskAnalysisIdAndOwnerIdAndActiveTrueOrderByCreatedAtAsc(
            UUID taskAnalysisId,
            UUID ownerId
    );

    Optional<TaskShareEntity> findByTaskAnalysisIdAndOwnerIdAndAccessModeAndActiveTrue(
            UUID taskAnalysisId,
            UUID ownerId,
            String accessMode
    );

    Optional<TaskShareEntity> findByIdAndTaskAnalysisIdAndOwnerId(
            UUID id,
            UUID taskAnalysisId,
            UUID ownerId
    );
}
