package com.milo.taskbuilder.task.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TaskDetailResponse(
        UUID id,
        String title,
        String category,
        String description,
        String educationalObjective,
        String professionalNotes,
        String contextLabel,
        String targetLabel,
        String supportLevel,
        String difficultyLevel,
        String environmentLabel,
        String visibility,
        String status,
        int stepCount,
        String authorName,
        UUID sourceTaskId,
        Instant lastUpdatedAt,
        List<TaskStepDetail> steps
) {

    public record TaskStepDetail(
            UUID id,
            int position,
            String title,
            String description,
            boolean required,
            String supportGuidance,
            String reinforcementNotes,
            Integer estimatedMinutes,
            VisualSupportDetail visualSupport
    ) {

        public TaskStepDetail(
                UUID id,
                int position,
                String title,
                String description,
                boolean required,
                String supportGuidance,
                String reinforcementNotes,
                Integer estimatedMinutes
        ) {
            this(id, position, title, description, required, supportGuidance, reinforcementNotes, estimatedMinutes, null);
        }
    }

    public record VisualSupportDetail(
            String text,
            StepSymbolDetail symbol,
            StepImageDetail image
    ) {
    }

    public record StepSymbolDetail(
            String library,
            String key,
            String label
    ) {
    }

    public record StepImageDetail(
            UUID mediaId,
            String storageKey,
            String fileName,
            String mimeType,
            long fileSizeBytes,
            Integer width,
            Integer height,
            String altText,
            String url
    ) {
    }
}
