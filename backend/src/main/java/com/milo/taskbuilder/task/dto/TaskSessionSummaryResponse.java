package com.milo.taskbuilder.task.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskSessionSummaryResponse(
        UUID id,
        UUID taskId,
        UUID ownerId,
        UUID shareId,
        String accessContext,
        int stepCount,
        boolean completed,
        Instant completedAt
) {
}
