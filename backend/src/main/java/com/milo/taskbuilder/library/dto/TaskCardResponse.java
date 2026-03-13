package com.milo.taskbuilder.library.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskCardResponse(
        UUID id,
        String title,
        String category,
        String targetLabel,
        String supportLevel,
        String contextLabel,
        String visibility,
        String status,
        int stepCount,
        String authorName,
        UUID sourceTaskId,
        Instant lastUpdatedAt
) {
}
