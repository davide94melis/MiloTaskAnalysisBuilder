package com.milo.taskbuilder.task.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskShareSummaryResponse(
        UUID id,
        UUID taskId,
        String mode,
        String token,
        String shareUrl,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        Instant revokedAt
) {
}
