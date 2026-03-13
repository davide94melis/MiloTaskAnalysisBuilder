package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TaskDetailService {

    private final TaskShellRepository taskShellRepository;
    private final TaskAnalysisStepRepository taskAnalysisStepRepository;
    private final TaskDetailMapper taskDetailMapper;

    public TaskDetailService(
            TaskShellRepository taskShellRepository,
            TaskAnalysisStepRepository taskAnalysisStepRepository,
            TaskDetailMapper taskDetailMapper
    ) {
        this.taskShellRepository = taskShellRepository;
        this.taskAnalysisStepRepository = taskAnalysisStepRepository;
        this.taskDetailMapper = taskDetailMapper;
    }

    @Transactional(readOnly = true)
    public TaskDetailResponse getTaskDetail(UUID taskId, UUID ownerId) {
        TaskShellEntity task = findOwnedTask(taskId, ownerId);
        List<TaskAnalysisStepEntity> steps = taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId);
        return taskDetailMapper.toResponse(task, steps);
    }

    @Transactional
    public TaskDetailResponse updateTask(UUID taskId, UUID ownerId, UpdateTaskRequest request) {
        TaskShellEntity task = findOwnedTask(taskId, ownerId);
        applyMetadata(task, request);

        List<TaskAnalysisStepEntity> persistedSteps = replaceSteps(taskId, request.steps());
        task.setStepCount(persistedSteps.size());

        TaskShellEntity savedTask = taskShellRepository.save(task);
        return taskDetailMapper.toResponse(savedTask, persistedSteps);
    }

    private TaskShellEntity findOwnedTask(UUID taskId, UUID ownerId) {
        return taskShellRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private void applyMetadata(TaskShellEntity task, UpdateTaskRequest request) {
        task.setTitle(required(request.title(), "title"));
        task.setCategory(normalize(request.category()));
        task.setDescription(normalize(request.description()));
        task.setEducationalObjective(normalize(request.educationalObjective()));
        task.setProfessionalNotes(normalize(request.professionalNotes()));
        task.setTargetLabel(normalize(request.targetLabel()));
        task.setSupportLevel(normalize(request.supportLevel()));
        task.setDifficultyLevel(normalize(request.difficultyLevel()));
        task.setContextLabel(normalize(request.environmentLabel()));
        task.setVisibility(parseVisibility(request.visibility()));
    }

    private List<TaskAnalysisStepEntity> replaceSteps(
            UUID taskId,
            List<UpdateTaskRequest.UpdateTaskStepRequest> requestedSteps
    ) {
        taskAnalysisStepRepository.deleteByTaskAnalysisId(taskId);

        if (requestedSteps == null || requestedSteps.isEmpty()) {
            return List.of();
        }

        List<TaskAnalysisStepEntity> stepsToSave = new ArrayList<>();
        for (int index = 0; index < requestedSteps.size(); index++) {
            UpdateTaskRequest.UpdateTaskStepRequest requestedStep = requestedSteps.get(index);

            TaskAnalysisStepEntity step = new TaskAnalysisStepEntity();
            step.setId(requestedStep.id());
            step.setTaskAnalysisId(taskId);
            step.setPosition(index);
            step.setTitle(normalize(requestedStep.title()));
            step.setDescription(normalize(requestedStep.description()));
            stepsToSave.add(step);
        }

        taskAnalysisStepRepository.saveAll(stepsToSave);
        return taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId);
    }

    private TaskShellVisibility parseVisibility(String visibility) {
        String normalized = normalize(visibility);
        if (normalized == null) {
            return TaskShellVisibility.PRIVATE;
        }
        return switch (normalized.toLowerCase()) {
            case "private" -> TaskShellVisibility.PRIVATE;
            case "template" -> TaskShellVisibility.TEMPLATE;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported visibility");
        };
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required field: " + fieldName);
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
