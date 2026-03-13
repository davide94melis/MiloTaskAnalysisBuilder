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
            Integer estimatedMinutes
    ) {
    }
}
