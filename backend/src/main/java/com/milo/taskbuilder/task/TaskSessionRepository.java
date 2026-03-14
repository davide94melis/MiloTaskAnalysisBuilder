package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskSessionRepository extends JpaRepository<TaskSessionEntity, UUID> {

    List<TaskSessionEntity> findByTaskAnalysisIdAndOwnerIdOrderByCompletedAtDescIdDesc(UUID taskAnalysisId, UUID ownerId);
}
