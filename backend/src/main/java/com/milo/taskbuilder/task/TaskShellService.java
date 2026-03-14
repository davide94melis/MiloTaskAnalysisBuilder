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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class TaskShellService {

    private static final String DEFAULT_TITLE = "Nuova task analysis";

    private final TaskShellRepository repository;
    private final TaskAnalysisStepRepository taskAnalysisStepRepository;
    private final TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;
    private final TaskShellMapper mapper;

    public TaskShellService(
            TaskShellRepository repository,
            TaskAnalysisStepRepository taskAnalysisStepRepository,
            TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository,
            TaskShellMapper mapper
    ) {
        this.repository = repository;
        this.taskAnalysisStepRepository = taskAnalysisStepRepository;
        this.taskAnalysisStepMediaRepository = taskAnalysisStepMediaRepository;
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

        return toCard(savedDraft, ownerId);
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

        List<TaskCardResponse> items = toCards(entities, ownerId);

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
        List<TaskShellEntity> drafts = repository.findRecentDrafts(ownerId).stream()
                .limit(5)
                .toList();
        List<TaskShellEntity> templates = repository.findTemplates().stream()
                .limit(3)
                .toList();

        return new DashboardResponse(
                toCards(drafts, ownerId),
                toCards(templates, null),
                new DashboardResponse.DashboardStats(
                        Math.toIntExact(repository.countByOwnerIdAndStatus(ownerId, TaskShellStatus.DRAFT)),
                        Math.toIntExact(repository.countByStatus(TaskShellStatus.TEMPLATE)),
                        0
                )
        );
    }

    @Transactional(readOnly = true)
    public List<TaskCardResponse> listTemplates() {
        return toCards(repository.findTemplates(), null);
    }

    @Transactional(readOnly = true)
    public TaskCardResponse reopenDraft(UUID taskId, UUID ownerId) {
        TaskShellEntity task = repository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Draft not found"));
        return toCard(task, ownerId);
    }

    @Transactional
    public TaskCardResponse duplicate(UUID sourceTaskId, UUID ownerId, String ownerEmail) {
        TaskShellEntity copy = duplicateAccessibleTask(sourceTaskId, ownerId, ownerEmail, null);
        TaskShellEntity savedCopy = repository.save(copy);
        copySteps(copy.getSourceTaskId(), savedCopy.getId());
        return toCard(savedCopy, ownerId);
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

        Map<UUID, List<TaskAnalysisStepMediaEntity>> sourceMediaByStepId = mediaByStepId(sourceTaskId);
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
                    copiedStep.setVisualText(sourceStep.getVisualText());
                    copiedStep.setSymbolLibrary(sourceStep.getSymbolLibrary());
                    copiedStep.setSymbolKey(sourceStep.getSymbolKey());
                    copiedStep.setSymbolLabel(sourceStep.getSymbolLabel());
                    return copiedStep;
                })
                .toList();

        List<TaskAnalysisStepEntity> savedSteps = taskAnalysisStepRepository.saveAll(copiedSteps);
        copyStepMedia(destinationTaskId, sourceSteps, savedSteps, sourceMediaByStepId);
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

    private void copyStepMedia(
            UUID destinationTaskId,
            List<TaskAnalysisStepEntity> sourceSteps,
            List<TaskAnalysisStepEntity> savedSteps,
            Map<UUID, List<TaskAnalysisStepMediaEntity>> sourceMediaByStepId
    ) {
        List<TaskAnalysisStepMediaEntity> copiedMedia = new ArrayList<>();
        for (int index = 0; index < savedSteps.size(); index++) {
            TaskAnalysisStepEntity sourceStep = sourceSteps.get(index);
            TaskAnalysisStepEntity savedStep = savedSteps.get(index);
            for (TaskAnalysisStepMediaEntity sourceMedia :
                    sourceMediaByStepId.getOrDefault(sourceStep.getId(), List.of())) {
                TaskAnalysisStepMediaEntity copied = new TaskAnalysisStepMediaEntity();
                copied.setTaskAnalysisId(destinationTaskId);
                copied.setTaskAnalysisStepId(savedStep.getId());
                copied.setKind(sourceMedia.getKind());
                copied.setStorageProvider(sourceMedia.getStorageProvider());
                copied.setStorageBucket(sourceMedia.getStorageBucket());
                copied.setStorageKey(sourceMedia.getStorageKey());
                copied.setFileName(sourceMedia.getFileName());
                copied.setMimeType(sourceMedia.getMimeType());
                copied.setFileSizeBytes(sourceMedia.getFileSizeBytes());
                copied.setWidth(sourceMedia.getWidth());
                copied.setHeight(sourceMedia.getHeight());
                copied.setAltText(sourceMedia.getAltText());
                copiedMedia.add(copied);
            }
        }

        if (!copiedMedia.isEmpty()) {
            taskAnalysisStepMediaRepository.saveAll(copiedMedia);
        }
    }

    private TaskCardResponse toCard(TaskShellEntity entity, UUID ownerId) {
        return mapper.toCard(entity, familyMetadataByTaskId(List.of(entity), ownerId).get(entity.getId()));
    }

    private List<TaskCardResponse> toCards(List<TaskShellEntity> entities, UUID ownerId) {
        Map<UUID, TaskShellMapper.FamilyMetadata> familyMetadataByTaskId = familyMetadataByTaskId(entities, ownerId);
        return entities.stream()
                .map(entity -> mapper.toCard(entity, familyMetadataByTaskId.get(entity.getId())))
                .toList();
    }

    private Map<UUID, TaskShellMapper.FamilyMetadata> familyMetadataByTaskId(List<TaskShellEntity> entities, UUID ownerId) {
        if (entities.isEmpty()) {
            return Map.of();
        }

        LinkedHashSet<UUID> rootIds = new LinkedHashSet<>();
        for (TaskShellEntity entity : entities) {
            rootIds.add(entity.getVariantFamilyId() == null ? entity.getId() : entity.getVariantFamilyId());
        }

        Map<UUID, TaskShellEntity> rootById = new HashMap<>();
        for (TaskShellEntity root : filterAccessible(repository.findByIdIn(List.copyOf(rootIds)), ownerId)) {
            rootById.put(root.getId(), root);
        }

        Map<UUID, List<TaskShellEntity>> variantsByRootId = new HashMap<>();
        for (TaskShellEntity variant : filterAccessible(repository.findByVariantFamilyIdIn(List.copyOf(rootIds)), ownerId)) {
            variantsByRootId.computeIfAbsent(variant.getVariantFamilyId(), ignored -> new ArrayList<>()).add(variant);
        }

        Map<UUID, TaskShellMapper.FamilyMetadata> metadataByTaskId = new HashMap<>();
        for (TaskShellEntity entity : entities) {
            UUID rootId = entity.getVariantFamilyId();
            if (rootId != null) {
                TaskShellEntity root = rootById.get(rootId);
                int variantCount = variantsByRootId.getOrDefault(rootId, List.of()).size() + (root == null ? 0 : 1);
                metadataByTaskId.put(entity.getId(), new TaskShellMapper.FamilyMetadata(
                        entity.getVariantFamilyId(),
                        rootId,
                        root == null ? null : root.getTitle(),
                        "variant",
                        variantCount
                ));
                continue;
            }

            int variantCount = variantsByRootId.getOrDefault(entity.getId(), List.of()).size() + 1;
            if (variantCount > 1) {
                metadataByTaskId.put(entity.getId(), new TaskShellMapper.FamilyMetadata(
                        null,
                        entity.getId(),
                        entity.getTitle(),
                        "root",
                        variantCount
                ));
                continue;
            }

            metadataByTaskId.put(entity.getId(), TaskShellMapper.FamilyMetadata.standalone());
        }

        return metadataByTaskId;
    }

    private List<TaskShellEntity> filterAccessible(Collection<TaskShellEntity> tasks, UUID ownerId) {
        return tasks.stream()
                .filter(task -> hasLibraryAccess(task, ownerId))
                .toList();
    }

    private boolean hasLibraryAccess(TaskShellEntity task, UUID ownerId) {
        if (task.getStatus() == TaskShellStatus.TEMPLATE) {
            return true;
        }
        return ownerId != null && Objects.equals(task.getOwnerId(), ownerId);
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
