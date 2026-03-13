package com.milo.taskbuilder.library.dto;

import java.util.UUID;

public record CreateTaskRequest(
        String title,
        UUID templateId
) {
}
