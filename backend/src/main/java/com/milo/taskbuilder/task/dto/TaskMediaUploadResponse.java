package com.milo.taskbuilder.task.dto;

import java.util.UUID;

public record TaskMediaUploadResponse(
        UUID mediaId,
        UUID taskId,
        String fileName,
        String mimeType,
        long fileSizeBytes,
        Integer width,
        Integer height,
        String storageKey,
        String altText,
        String url
) {
}
