package com.milo.taskbuilder.task.dto;

import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
        String title,
        String category,
        String description,
        String educationalObjective,
        String professionalNotes,
        String targetLabel,
        String supportLevel,
        String difficultyLevel,
        String environmentLabel,
        String visibility,
        List<UpdateTaskStepRequest> steps
) {

    public record UpdateTaskStepRequest(
            UUID id,
            Integer position,
            String title,
            String description,
            Boolean required,
            String supportGuidance,
            String reinforcementNotes,
            Integer estimatedMinutes,
            VisualSupportRequest visualSupport
    ) {

        public UpdateTaskStepRequest(
                UUID id,
                Integer position,
                String title,
                String description,
                Boolean required,
                String supportGuidance,
                String reinforcementNotes,
                Integer estimatedMinutes
        ) {
            this(id, position, title, description, required, supportGuidance, reinforcementNotes, estimatedMinutes, null);
        }
    }

    public record VisualSupportRequest(
            String text,
            StepSymbolRequest symbol,
            StepImageRequest image
    ) {
    }

    public record StepSymbolRequest(
            String library,
            String key,
            String label
    ) {
    }

    public record StepImageRequest(
            UUID mediaId,
            String storageKey,
            String fileName,
            String mimeType,
            Long fileSizeBytes,
            Integer width,
            Integer height,
            String altText,
            String url
    ) {
    }
}
