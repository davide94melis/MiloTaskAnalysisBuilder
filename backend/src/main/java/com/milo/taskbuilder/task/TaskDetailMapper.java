package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskDetailMapper {

    public TaskDetailResponse toResponse(TaskShellEntity task, List<TaskAnalysisStepEntity> steps) {
        return new TaskDetailResponse(
                task.getId(),
                task.getTitle(),
                task.getCategory(),
                task.getDescription(),
                task.getEducationalObjective(),
                task.getProfessionalNotes(),
                task.getContextLabel(),
                task.getTargetLabel(),
                task.getSupportLevel(),
                task.getDifficultyLevel(),
                task.getContextLabel(),
                task.getVisibility().getValue(),
                task.getStatus().getValue(),
                task.getStepCount(),
                task.getAuthorName(),
                task.getSourceTaskId(),
                task.getUpdatedAt(),
                steps.stream()
                        .map(this::toStepDetail)
                        .toList()
        );
    }

    private TaskDetailResponse.TaskStepDetail toStepDetail(TaskAnalysisStepEntity step) {
        return new TaskDetailResponse.TaskStepDetail(
                step.getId(),
                step.getPosition(),
                step.getTitle(),
                step.getDescription()
        );
    }
}
