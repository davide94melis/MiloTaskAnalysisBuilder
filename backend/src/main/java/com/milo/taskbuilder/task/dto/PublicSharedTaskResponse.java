package com.milo.taskbuilder.task.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicSharedTaskResponse(
        UUID taskId,
        String title,
        String category,
        String description,
        int stepCount,
        Instant lastUpdatedAt,
        List<SharedTaskStep> steps
) {

    public PublicSharedTaskResponse {
        steps = steps == null ? List.of() : List.copyOf(steps);
    }

    public record SharedTaskStep(
            UUID id,
            int position,
            String title,
            String description,
            boolean required,
            SharedVisualSupport visualSupport
    ) {
    }

    public record SharedVisualSupport(
            String text,
            SharedStepSymbol symbol,
            SharedStepImage image
    ) {
    }

    public record SharedStepSymbol(
            String library,
            String key,
            String label
    ) {
    }

    public record SharedStepImage(
            UUID mediaId,
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
