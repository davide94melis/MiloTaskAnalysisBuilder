package com.milo.taskbuilder.task.dto;

public record CreateTaskSessionRequest(
        Integer stepCount,
        Boolean completed
) {
}
