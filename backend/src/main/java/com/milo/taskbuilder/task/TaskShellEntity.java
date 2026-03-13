package com.milo.taskbuilder.task;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_analysis", schema = "taskbuilder")
public class TaskShellEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "source_task_id")
    private UUID sourceTaskId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category")
    private String category;

    @Column(name = "description")
    private String description;

    @Column(name = "educational_objective")
    private String educationalObjective;

    @Column(name = "professional_notes")
    private String professionalNotes;

    @Column(name = "target_label")
    private String targetLabel;

    @Column(name = "support_level")
    private String supportLevel;

    @Column(name = "difficulty_level")
    private String difficultyLevel;

    @Column(name = "context_label")
    private String contextLabel;

    @Convert(converter = TaskShellStatusConverter.class)
    @Column(name = "status", nullable = false)
    private TaskShellStatus status;

    @Convert(converter = TaskShellVisibilityConverter.class)
    @Column(name = "visibility", nullable = false)
    private TaskShellVisibility visibility;

    @Column(name = "step_count", nullable = false)
    private int stepCount;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public UUID getSourceTaskId() {
        return sourceTaskId;
    }

    public void setSourceTaskId(UUID sourceTaskId) {
        this.sourceTaskId = sourceTaskId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEducationalObjective() {
        return educationalObjective;
    }

    public void setEducationalObjective(String educationalObjective) {
        this.educationalObjective = educationalObjective;
    }

    public String getProfessionalNotes() {
        return professionalNotes;
    }

    public void setProfessionalNotes(String professionalNotes) {
        this.professionalNotes = professionalNotes;
    }

    public String getTargetLabel() {
        return targetLabel;
    }

    public void setTargetLabel(String targetLabel) {
        this.targetLabel = targetLabel;
    }

    public String getSupportLevel() {
        return supportLevel;
    }

    public void setSupportLevel(String supportLevel) {
        this.supportLevel = supportLevel;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public String getContextLabel() {
        return contextLabel;
    }

    public void setContextLabel(String contextLabel) {
        this.contextLabel = contextLabel;
    }

    public TaskShellStatus getStatus() {
        return status;
    }

    public void setStatus(TaskShellStatus status) {
        this.status = status;
    }

    public TaskShellVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(TaskShellVisibility visibility) {
        this.visibility = visibility;
    }

    public int getStepCount() {
        return stepCount;
    }

    public void setStepCount(int stepCount) {
        this.stepCount = stepCount;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
