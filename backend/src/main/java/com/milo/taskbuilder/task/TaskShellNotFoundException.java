package com.milo.taskbuilder.task;

import java.util.UUID;

public class TaskShellNotFoundException extends RuntimeException {

    public TaskShellNotFoundException(UUID taskId) {
        super("Task shell not found: " + taskId);
    }
}
