package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskAnalysisStepMediaRepository extends JpaRepository<TaskAnalysisStepMediaEntity, UUID> {

    List<TaskAnalysisStepMediaEntity> findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(UUID taskAnalysisId);

    Optional<TaskAnalysisStepMediaEntity> findByIdAndTaskAnalysisId(UUID id, UUID taskAnalysisId);
}
