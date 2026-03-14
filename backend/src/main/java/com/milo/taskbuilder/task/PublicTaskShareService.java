package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.task.dto.PublicSharedPresentResponse;
import com.milo.taskbuilder.task.dto.PublicSharedTaskResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PublicTaskShareService {

    private final TaskShareRepository taskShareRepository;
    private final TaskShellRepository taskShellRepository;
    private final TaskAnalysisStepRepository taskAnalysisStepRepository;
    private final TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;
    private final PublicTaskDetailMapper publicTaskDetailMapper;
    private final TaskMediaStorageService taskMediaStorageService;
    private final TaskShellService taskShellService;

    public PublicTaskShareService(
            TaskShareRepository taskShareRepository,
            TaskShellRepository taskShellRepository,
            TaskAnalysisStepRepository taskAnalysisStepRepository,
            TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository,
            PublicTaskDetailMapper publicTaskDetailMapper,
            TaskMediaStorageService taskMediaStorageService,
            TaskShellService taskShellService
    ) {
        this.taskShareRepository = taskShareRepository;
        this.taskShellRepository = taskShellRepository;
        this.taskAnalysisStepRepository = taskAnalysisStepRepository;
        this.taskAnalysisStepMediaRepository = taskAnalysisStepMediaRepository;
        this.publicTaskDetailMapper = publicTaskDetailMapper;
        this.taskMediaStorageService = taskMediaStorageService;
        this.taskShellService = taskShellService;
    }

    @Transactional(readOnly = true)
    public PublicSharedTaskResponse getSharedTask(String token) {
        TaskShareEntity share = findActiveShare(token, "view");
        TaskShellEntity task = findTask(share.getTaskAnalysisId());
        List<TaskAnalysisStepEntity> steps = loadSteps(task.getId());
        return publicTaskDetailMapper.toSharedTaskResponse(
                task,
                steps,
                mediaByStepId(task.getId()),
                taskMediaStorageService::buildPublicAccessUrl,
                share.getShareToken()
        );
    }

    @Transactional(readOnly = true)
    public PublicSharedPresentResponse getSharedPresent(String token) {
        TaskShareEntity share = findActiveShare(token, "present");
        TaskShellEntity task = findTask(share.getTaskAnalysisId());
        List<TaskAnalysisStepEntity> steps = loadSteps(task.getId());
        return publicTaskDetailMapper.toSharedPresentResponse(
                task,
                steps,
                mediaByStepId(task.getId()),
                taskMediaStorageService::buildPublicAccessUrl,
                share.getShareToken()
        );
    }

    @Transactional(readOnly = true)
    public TaskMediaStorageService.StoredTaskMediaContent loadSharedMedia(String token, UUID mediaId) {
        TaskShareEntity share = findAnyActiveShare(token);
        UUID taskId = share.getTaskAnalysisId();
        TaskAnalysisStepMediaEntity media = taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId)
                .orElseThrow(() -> notFound());

        if (media.getTaskAnalysisStepId() == null) {
            throw notFound();
        }

        boolean attached = loadSteps(taskId).stream()
                .map(TaskAnalysisStepEntity::getId)
                .anyMatch(stepId -> stepId.equals(media.getTaskAnalysisStepId()));
        if (!attached) {
            throw notFound();
        }

        return taskMediaStorageService.loadSharedMedia(taskId, mediaId);
    }

    @Transactional
    public TaskCardResponse duplicateSharedTask(String token, UUID ownerId, String ownerEmail) {
        TaskShareEntity share = findAnyActiveShare(token);
        TaskShellEntity task = findTask(share.getTaskAnalysisId());
        return taskShellService.duplicateSharedTask(task, ownerId, ownerEmail);
    }

    private TaskShareEntity findActiveShare(String token, String mode) {
        return taskShareRepository.findByShareTokenAndAccessModeAndActiveTrue(token, mode)
                .orElseThrow(this::notFound);
    }

    private TaskShareEntity findAnyActiveShare(String token) {
        return taskShareRepository.findByShareTokenAndActiveTrue(token)
                .orElseThrow(this::notFound);
    }

    private TaskShellEntity findTask(UUID taskId) {
        return taskShellRepository.findById(taskId)
                .orElseThrow(this::notFound);
    }

    private List<TaskAnalysisStepEntity> loadSteps(UUID taskId) {
        return taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId);
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

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found");
    }
}
