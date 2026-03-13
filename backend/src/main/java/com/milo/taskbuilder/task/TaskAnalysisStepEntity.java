package com.milo.taskbuilder.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_analysis_step", schema = "taskbuilder")
public class TaskAnalysisStepEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "task_analysis_id", nullable = false)
    private UUID taskAnalysisId;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "required", nullable = false)
    private boolean required = true;

    @Column(name = "support_guidance")
    private String supportGuidance;

    @Column(name = "reinforcement_notes")
    private String reinforcementNotes;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "visual_text")
    private String visualText;

    @Column(name = "symbol_library")
    private String symbolLibrary;

    @Column(name = "symbol_key")
    private String symbolKey;

    @Column(name = "symbol_label")
    private String symbolLabel;

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

    public UUID getTaskAnalysisId() {
        return taskAnalysisId;
    }

    public void setTaskAnalysisId(UUID taskAnalysisId) {
        this.taskAnalysisId = taskAnalysisId;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public String getSupportGuidance() {
        return supportGuidance;
    }

    public void setSupportGuidance(String supportGuidance) {
        this.supportGuidance = supportGuidance;
    }

    public String getReinforcementNotes() {
        return reinforcementNotes;
    }

    public void setReinforcementNotes(String reinforcementNotes) {
        this.reinforcementNotes = reinforcementNotes;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public String getVisualText() {
        return visualText;
    }

    public void setVisualText(String visualText) {
        this.visualText = visualText;
    }

    public String getSymbolLibrary() {
        return symbolLibrary;
    }

    public void setSymbolLibrary(String symbolLibrary) {
        this.symbolLibrary = symbolLibrary;
    }

    public String getSymbolKey() {
        return symbolKey;
    }

    public void setSymbolKey(String symbolKey) {
        this.symbolKey = symbolKey;
    }

    public String getSymbolLabel() {
        return symbolLabel;
    }

    public void setSymbolLabel(String symbolLabel) {
        this.symbolLabel = symbolLabel;
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
