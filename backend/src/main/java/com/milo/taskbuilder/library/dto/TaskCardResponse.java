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
        Instant lastUpdatedAt,
        UUID variantFamilyId,
        UUID variantRootTaskId,
        String variantRootTitle,
        String variantRole,
        int variantCount
) {

    public TaskCardResponse {
        variantRole = variantRole == null || variantRole.isBlank() ? "standalone" : variantRole;
        variantCount = variantCount <= 0 ? 1 : variantCount;
    }

    public TaskCardResponse(
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
        this(
                id,
                title,
                category,
                targetLabel,
                supportLevel,
                contextLabel,
                visibility,
                status,
                stepCount,
                authorName,
                sourceTaskId,
                lastUpdatedAt,
                null,
                null,
                null,
                "standalone",
                1
        );
    }
}
