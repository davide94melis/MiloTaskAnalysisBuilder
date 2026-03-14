package com.milo.taskbuilder.task.dto;

import java.util.List;
import java.util.UUID;

public record PublicSharedPresentResponse(
        UUID taskId,
        String title,
        int stepCount,
        List<PresentStep> steps
) {

    public PublicSharedPresentResponse {
        steps = steps == null ? List.of() : List.copyOf(steps);
    }

    public record PresentStep(
            UUID id,
            int position,
            String title,
            String description,
            boolean required,
            PublicSharedTaskResponse.SharedVisualSupport visualSupport
    ) {
    }
}
