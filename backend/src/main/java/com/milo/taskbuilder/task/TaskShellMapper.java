package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import org.springframework.stereotype.Component;

@Component
public class TaskShellMapper {

    public TaskCardResponse toCard(TaskShellEntity entity) {
        return new TaskCardResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getTargetLabel(),
                entity.getSupportLevel(),
                entity.getContextLabel(),
                entity.getVisibility().getValue(),
                entity.getStatus().getValue(),
                entity.getStepCount(),
                entity.getAuthorName(),
                entity.getSourceTaskId(),
                entity.getUpdatedAt()
        );
    }
}
