package com.milo.taskbuilder.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_session", schema = "taskbuilder")
public class TaskSessionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "task_analysis_id", nullable = false)
    private UUID taskAnalysisId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "task_share_id")
    private UUID taskShareId;

    @Column(name = "access_context", nullable = false)
    private String accessContext;

    @Column(name = "step_count", nullable = false)
    private int stepCount;

    @Column(name = "completed", nullable = false)
    private boolean completed = true;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (completedAt == null) {
            completedAt = now;
        }
        createdAt = now;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTaskAnalysisId() {
        return taskAnalysisId;
    }

    public void setTaskAnalysisId(UUID taskAnalysisId) {
        this.taskAnalysisId = taskAnalysisId;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public UUID getTaskShareId() {
        return taskShareId;
    }

    public void setTaskShareId(UUID taskShareId) {
        this.taskShareId = taskShareId;
    }

    public String getAccessContext() {
        return accessContext;
    }

    public void setAccessContext(String accessContext) {
        this.accessContext = accessContext;
    }

    public int getStepCount() {
        return stepCount;
    }

    public void setStepCount(int stepCount) {
        this.stepCount = stepCount;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
