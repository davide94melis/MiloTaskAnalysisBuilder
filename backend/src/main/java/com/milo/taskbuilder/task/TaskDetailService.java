package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class TaskDetailService {

    private final TaskShellRepository taskShellRepository;
    private final TaskAnalysisStepRepository taskAnalysisStepRepository;
    private final TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;
    private final TaskDetailMapper taskDetailMapper;
    private final TaskMediaStorageService taskMediaStorageService;

    public TaskDetailService(
            TaskShellRepository taskShellRepository,
            TaskAnalysisStepRepository taskAnalysisStepRepository,
            TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository,
            TaskDetailMapper taskDetailMapper,
            TaskMediaStorageService taskMediaStorageService
    ) {
        this.taskShellRepository = taskShellRepository;
        this.taskAnalysisStepRepository = taskAnalysisStepRepository;
        this.taskAnalysisStepMediaRepository = taskAnalysisStepMediaRepository;
        this.taskDetailMapper = taskDetailMapper;
        this.taskMediaStorageService = taskMediaStorageService;
    }

    @Transactional(readOnly = true)
    public TaskDetailResponse getTaskDetail(UUID taskId, UUID ownerId) {
        TaskShellEntity task = findOwnedTask(taskId, ownerId);
        List<TaskAnalysisStepEntity> steps = taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId);
        FamilyContext familyContext = familyContext(task, ownerId);
        return taskDetailMapper.toResponse(
                task,
                steps,
                mediaByStepId(taskId),
                taskMediaStorageService::buildAccessUrl,
                familyContext.metadata(),
                familyContext.relatedVariants()
        );
    }

    @Transactional
    public TaskDetailResponse updateTask(UUID taskId, UUID ownerId, UpdateTaskRequest request) {
        TaskShellEntity task = findOwnedTask(taskId, ownerId);
        applyMetadata(task, request);

        List<TaskAnalysisStepEntity> persistedSteps = replaceSteps(taskId, request.steps());
        task.setStepCount(persistedSteps.size());

        TaskShellEntity savedTask = taskShellRepository.save(task);
        FamilyContext familyContext = familyContext(savedTask, ownerId);
        return taskDetailMapper.toResponse(
                savedTask,
                persistedSteps,
                mediaByStepId(taskId),
                taskMediaStorageService::buildAccessUrl,
                familyContext.metadata(),
                familyContext.relatedVariants()
        );
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
            step.setPosition(index + 1);
            step.setTitle(normalize(requestedStep.title()));
            step.setDescription(normalize(requestedStep.description()));
            step.setRequired(defaultRequired(requestedStep.required()));
            step.setSupportGuidance(normalize(requestedStep.supportGuidance()));
            step.setReinforcementNotes(normalize(requestedStep.reinforcementNotes()));
            step.setEstimatedMinutes(validEstimatedMinutes(requestedStep.estimatedMinutes()));
            applyVisualSupport(step, requestedStep.visualSupport());
            stepsToSave.add(step);
        }

        taskAnalysisStepRepository.saveAll(stepsToSave);
        List<TaskAnalysisStepEntity> persistedSteps =
                taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId);
        attachStepMedia(taskId, requestedSteps, persistedSteps);
        return persistedSteps;
    }

    private void applyVisualSupport(
            TaskAnalysisStepEntity step,
            UpdateTaskRequest.VisualSupportRequest visualSupport
    ) {
        String visualText = normalize(visualSupport == null ? null : visualSupport.text());
        UpdateTaskRequest.StepSymbolRequest symbol = visualSupport == null ? null : visualSupport.symbol();
        UpdateTaskRequest.StepImageRequest image = visualSupport == null ? null : visualSupport.image();

        String symbolLibrary = normalize(symbol == null ? null : symbol.library());
        String symbolKey = normalize(symbol == null ? null : symbol.key());
        String symbolLabel = normalize(symbol == null ? null : symbol.label());
        boolean hasPartialSymbol = symbolLibrary != null || symbolKey != null || symbolLabel != null;
        boolean hasSymbol = symbolLibrary != null && symbolKey != null;
        boolean hasImage = image != null && image.mediaId() != null;

        if (hasPartialSymbol && !hasSymbol) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "symbol library and key are required together");
        }
        if (visualText == null && !hasSymbol && !hasImage) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each step must include at least one visual support");
        }

        step.setVisualText(visualText);
        step.setSymbolLibrary(symbolLibrary);
        step.setSymbolKey(symbolKey);
        step.setSymbolLabel(symbolLabel);
    }

    private void attachStepMedia(
            UUID taskId,
            List<UpdateTaskRequest.UpdateTaskStepRequest> requestedSteps,
            List<TaskAnalysisStepEntity> persistedSteps
    ) {
        for (int index = 0; index < persistedSteps.size(); index++) {
            UpdateTaskRequest.VisualSupportRequest visualSupport = requestedSteps.get(index).visualSupport();
            UpdateTaskRequest.StepImageRequest image = visualSupport == null ? null : visualSupport.image();
            if (image == null || image.mediaId() == null) {
                continue;
            }

            TaskAnalysisStepMediaEntity media = taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(image.mediaId(), taskId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown media reference for task"));
            media.setTaskAnalysisStepId(persistedSteps.get(index).getId());
            media.setAltText(normalize(image.altText()));
            taskAnalysisStepMediaRepository.save(media);
        }
    }

    private Map<UUID, List<TaskAnalysisStepMediaEntity>> mediaByStepId(UUID taskId) {
        Map<UUID, List<TaskAnalysisStepMediaEntity>> mediaByStepId = new HashMap<>();
        for (TaskAnalysisStepMediaEntity media :
                taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(taskId)) {
            if (media.getTaskAnalysisStepId() == null) {
                continue;
            }
            mediaByStepId.computeIfAbsent(media.getTaskAnalysisStepId(), ignored -> new ArrayList<>()).add(media);
        }
        return mediaByStepId;
    }

    private FamilyContext familyContext(TaskShellEntity task, UUID ownerId) {
        UUID rootId = task.getVariantFamilyId() == null ? task.getId() : task.getVariantFamilyId();
        TaskShellEntity root = safeList(taskShellRepository.findByIdIn(List.of(rootId))).stream()
                .filter(candidate -> Objects.equals(candidate.getId(), rootId))
                .findFirst()
                .orElse(null);

        List<TaskShellEntity> variants = safeList(taskShellRepository.findByVariantFamilyIdIn(List.of(rootId))).stream()
                .filter(candidate -> Objects.equals(candidate.getOwnerId(), ownerId))
                .sorted(Comparator
                        .comparing((TaskShellEntity candidate) -> normalize(candidate.getSupportLevel()),
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(candidate -> normalize(candidate.getTitle()),
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(TaskShellEntity::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (task.getVariantFamilyId() != null) {
            int variantCount = variants.size() + (root == null ? 0 : 1);
            List<TaskDetailResponse.RelatedVariantSummary> relatedVariants = new ArrayList<>();
            if (root != null && !Objects.equals(root.getId(), task.getId())) {
                relatedVariants.add(toRelatedVariant(root, "root"));
            }
            for (TaskShellEntity variant : variants) {
                if (!Objects.equals(variant.getId(), task.getId())) {
                    relatedVariants.add(toRelatedVariant(variant, "variant"));
                }
            }
            return new FamilyContext(
                    new TaskShellMapper.FamilyMetadata(
                            task.getVariantFamilyId(),
                            rootId,
                            root == null ? null : root.getTitle(),
                            "variant",
                            variantCount
                    ),
                    relatedVariants
            );
        }

        if (!variants.isEmpty()) {
            List<TaskDetailResponse.RelatedVariantSummary> relatedVariants = variants.stream()
                    .filter(variant -> !Objects.equals(variant.getId(), task.getId()))
                    .map(variant -> toRelatedVariant(variant, "variant"))
                    .toList();
            return new FamilyContext(
                    new TaskShellMapper.FamilyMetadata(
                            null,
                            task.getId(),
                            task.getTitle(),
                            "root",
                            variants.size() + 1
                    ),
                    relatedVariants
            );
        }

        return new FamilyContext(TaskShellMapper.FamilyMetadata.standalone(), List.of());
    }

    private TaskDetailResponse.RelatedVariantSummary toRelatedVariant(TaskShellEntity task, String variantRole) {
        return new TaskDetailResponse.RelatedVariantSummary(
                task.getId(),
                task.getTitle(),
                task.getSupportLevel(),
                variantRole,
                task.getUpdatedAt()
        );
    }

    private <T> List<T> safeList(List<T> values) {
        return values == null ? List.of() : values;
    }

    private boolean defaultRequired(Boolean required) {
        return !Objects.equals(required, Boolean.FALSE);
    }

    private Integer validEstimatedMinutes(Integer estimatedMinutes) {
        if (estimatedMinutes == null) {
            return null;
        }
        if (estimatedMinutes < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "estimatedMinutes must be non-negative");
        }
        return estimatedMinutes;
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

    private record FamilyContext(
            TaskShellMapper.FamilyMetadata metadata,
            List<TaskDetailResponse.RelatedVariantSummary> relatedVariants
    ) {
    }
}
