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
            Integer estimatedMinutes
    ) {
    }
}
