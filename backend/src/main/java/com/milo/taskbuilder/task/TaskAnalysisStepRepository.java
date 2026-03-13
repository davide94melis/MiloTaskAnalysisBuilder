package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskAnalysisStepRepository extends JpaRepository<TaskAnalysisStepEntity, UUID> {

    List<TaskAnalysisStepEntity> findByTaskAnalysisIdOrderByPositionAscIdAsc(UUID taskAnalysisId);

    void deleteByTaskAnalysisId(UUID taskAnalysisId);
}
