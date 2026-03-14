package com.milo.taskbuilder.library.dto;

import java.util.UUID;

public record CreateTaskRequest(
        String title,
        UUID templateId,
        UUID variantSourceTaskId,
        String supportLevel
) {
    public CreateTaskRequest(String title, UUID templateId) {
        this(title, templateId, null, null);
    }

    public boolean isVariantCreation() {
        return variantSourceTaskId != null;
    }
}
