package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.CreateTaskRequest;
import com.milo.taskbuilder.library.dto.DashboardResponse;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryFilterOptionsResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class TaskShellService {

    private static final String DEFAULT_TITLE = "Nuova task analysis";

    private final TaskShellRepository repository;
    private final TaskAnalysisStepRepository taskAnalysisStepRepository;
    private final TaskShellMapper mapper;

    public TaskShellService(
            TaskShellRepository repository,
            TaskAnalysisStepRepository taskAnalysisStepRepository,
            TaskShellMapper mapper
    ) {
        this.repository = repository;
        this.taskAnalysisStepRepository = taskAnalysisStepRepository;
        this.mapper = mapper;
    }

    @Transactional
    public TaskCardResponse createDraft(UUID ownerId, String ownerEmail, CreateTaskRequest request) {
        TaskShellEntity draft = request.templateId() == null
                ? newDraft(ownerId, ownerEmail, request.title())
                : duplicateAccessibleTask(request.templateId(), ownerId, ownerEmail, request.title());

        TaskShellEntity savedDraft = repository.save(draft);
        if (draft.getSourceTaskId() != null) {
            copySteps(draft.getSourceTaskId(), savedDraft.getId());
        }

        return mapper.toCard(savedDraft);
    }

    @Transactional(readOnly = true)
    public TaskLibraryResponse listLibrary(UUID ownerId, TaskLibraryFilter filter) {
        List<TaskShellEntity> entities = repository.findLibraryCards(
                        ownerId,
                        normalize(filter.category()),
                        normalize(filter.context()),
                        normalize(filter.targetLabel()),
                        normalize(filter.author()),
                        parseStatus(filter.status()),
                        normalize(filter.supportLevel()),
                        normalize(filter.search())
                );

        List<TaskCardResponse> items = entities.stream()
                .map(mapper::toCard)
                .toList();

        TaskLibraryFilterOptionsResponse availableFilters = new TaskLibraryFilterOptionsResponse(
                distinctSorted(entities.stream().map(TaskShellEntity::getCategory).toList()),
                distinctSorted(entities.stream().map(TaskShellEntity::getContextLabel).toList()),
                distinctSorted(entities.stream().map(TaskShellEntity::getTargetLabel).toList()),
                distinctSorted(entities.stream().map(TaskShellEntity::getAuthorName).toList()),
                distinctSorted(entities.stream().map(task -> task.getStatus().getValue()).toList()),
                distinctSorted(entities.stream().map(TaskShellEntity::getSupportLevel).toList())
        );

        return new TaskLibraryResponse(items, availableFilters);
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID ownerId) {
        List<TaskCardResponse> drafts = repository.findRecentDrafts(ownerId).stream()
                .limit(5)
                .map(mapper::toCard)
                .toList();
        List<TaskCardResponse> templates = repository.findTemplates().stream()
                .limit(3)
                .map(mapper::toCard)
                .toList();

        return new DashboardResponse(
                drafts,
                templates,
                new DashboardResponse.DashboardStats(
                        Math.toIntExact(repository.countByOwnerIdAndStatus(ownerId, TaskShellStatus.DRAFT)),
                        Math.toIntExact(repository.countByStatus(TaskShellStatus.TEMPLATE)),
                        0
                )
        );
    }

    @Transactional(readOnly = true)
    public List<TaskCardResponse> listTemplates() {
        return repository.findTemplates().stream()
                .map(mapper::toCard)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskCardResponse reopenDraft(UUID taskId, UUID ownerId) {
        TaskShellEntity task = repository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Draft not found"));
        return mapper.toCard(task);
    }

    @Transactional
    public TaskCardResponse duplicate(UUID sourceTaskId, UUID ownerId, String ownerEmail) {
        TaskShellEntity copy = duplicateAccessibleTask(sourceTaskId, ownerId, ownerEmail, null);
        TaskShellEntity savedCopy = repository.save(copy);
        copySteps(copy.getSourceTaskId(), savedCopy.getId());
        return mapper.toCard(savedCopy);
    }

    private TaskShellEntity newDraft(UUID ownerId, String ownerEmail, String requestedTitle) {
        TaskShellEntity entity = new TaskShellEntity();
        entity.setOwnerId(ownerId);
        entity.setTitle(normalize(requestedTitle) == null ? DEFAULT_TITLE : requestedTitle.trim());
        entity.setStatus(TaskShellStatus.DRAFT);
        entity.setVisibility(TaskShellVisibility.PRIVATE);
        entity.setAuthorName(ownerEmail);
        entity.setStepCount(0);
        return entity;
    }

    private TaskShellEntity duplicateAccessibleTask(UUID sourceTaskId, UUID ownerId, String ownerEmail, String requestedTitle) {
        TaskShellEntity source = repository.findAccessibleById(sourceTaskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task source not found"));

        TaskShellEntity copy = new TaskShellEntity();
        copy.setOwnerId(ownerId);
        copy.setSourceTaskId(source.getId());
        copy.setTitle(normalize(requestedTitle) == null ? source.getTitle() : requestedTitle.trim());
        copy.setCategory(source.getCategory());
        copy.setDescription(source.getDescription());
        copy.setEducationalObjective(source.getEducationalObjective());
        copy.setProfessionalNotes(source.getProfessionalNotes());
        copy.setTargetLabel(source.getTargetLabel());
        copy.setSupportLevel(source.getSupportLevel());
        copy.setDifficultyLevel(source.getDifficultyLevel());
        copy.setContextLabel(source.getContextLabel());
        copy.setStatus(TaskShellStatus.DRAFT);
        copy.setVisibility(TaskShellVisibility.PRIVATE);
        copy.setStepCount(source.getStepCount());
        copy.setAuthorName(ownerEmail);
        return copy;
    }

    private void copySteps(UUID sourceTaskId, UUID destinationTaskId) {
        if (sourceTaskId == null) {
            return;
        }

        List<TaskAnalysisStepEntity> sourceSteps =
                taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(sourceTaskId);

        if (sourceSteps.isEmpty()) {
            return;
        }

        List<TaskAnalysisStepEntity> copiedSteps = sourceSteps.stream()
                .map(sourceStep -> {
                    TaskAnalysisStepEntity copiedStep = new TaskAnalysisStepEntity();
                    copiedStep.setTaskAnalysisId(destinationTaskId);
                    copiedStep.setPosition(sourceStep.getPosition());
                    copiedStep.setTitle(sourceStep.getTitle());
                    copiedStep.setDescription(sourceStep.getDescription());
                    copiedStep.setRequired(sourceStep.isRequired());
                    copiedStep.setSupportGuidance(sourceStep.getSupportGuidance());
                    copiedStep.setReinforcementNotes(sourceStep.getReinforcementNotes());
                    copiedStep.setEstimatedMinutes(sourceStep.getEstimatedMinutes());
                    return copiedStep;
                })
                .toList();

        taskAnalysisStepRepository.saveAll(copiedSteps);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private TaskShellStatus parseStatus(String status) {
        String normalized = normalize(status);
        if (normalized == null) {
            return null;
        }
        return switch (normalized.toLowerCase()) {
            case "draft" -> TaskShellStatus.DRAFT;
            case "template" -> TaskShellStatus.TEMPLATE;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status filter");
        };
    }

    private List<String> distinctSorted(List<String> values) {
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();
    }

    public record TaskLibraryFilter(
            String category,
            String context,
            String targetLabel,
            String author,
            String status,
            String supportLevel,
            String search
    ) {
    }
}
