package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.CreateTaskShareRequest;
import com.milo.taskbuilder.task.dto.TaskShareSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TaskShareService {

    private final TaskShellRepository taskShellRepository;
    private final TaskShareRepository taskShareRepository;

    public TaskShareService(
            TaskShellRepository taskShellRepository,
            TaskShareRepository taskShareRepository
    ) {
        this.taskShellRepository = taskShellRepository;
        this.taskShareRepository = taskShareRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskShareSummaryResponse> listShares(UUID taskId, UUID ownerId) {
        findOwnedTask(taskId, ownerId);
        return taskShareRepository.findByTaskAnalysisIdAndOwnerIdAndActiveTrueOrderByCreatedAtAsc(taskId, ownerId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public TaskShareSummaryResponse createShare(UUID taskId, UUID ownerId, CreateTaskShareRequest request) {
        ShareMode mode = parseMode(request == null ? null : request.mode());
        findOwnedTask(taskId, ownerId);

        return taskShareRepository.findByTaskAnalysisIdAndOwnerIdAndAccessModeAndActiveTrue(taskId, ownerId, mode.value())
                .map(this::toSummary)
                .orElseGet(() -> toSummary(taskShareRepository.save(newActiveShare(taskId, ownerId, mode))));
    }

    @Transactional
    public TaskShareSummaryResponse regenerateShare(UUID taskId, UUID ownerId, String requestedMode) {
        ShareMode mode = parseMode(requestedMode);
        findOwnedTask(taskId, ownerId);

        taskShareRepository.findByTaskAnalysisIdAndOwnerIdAndAccessModeAndActiveTrue(taskId, ownerId, mode.value())
                .ifPresent(this::revokeActiveShare);

        return toSummary(taskShareRepository.save(newActiveShare(taskId, ownerId, mode)));
    }

    @Transactional
    public TaskShareSummaryResponse revokeShare(UUID taskId, UUID shareId, UUID ownerId) {
        findOwnedTask(taskId, ownerId);
        TaskShareEntity share = taskShareRepository.findByIdAndTaskAnalysisIdAndOwnerId(shareId, taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task share not found"));

        if (share.isActive()) {
            revokeActiveShare(share);
        }

        return toSummary(share);
    }

    private void findOwnedTask(UUID taskId, UUID ownerId) {
        taskShellRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private TaskShareEntity newActiveShare(UUID taskId, UUID ownerId, ShareMode mode) {
        TaskShareEntity entity = new TaskShareEntity();
        entity.setTaskAnalysisId(taskId);
        entity.setOwnerId(ownerId);
        entity.setAccessMode(mode.value());
        entity.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        entity.setActive(true);
        entity.setRevokedAt(null);
        return entity;
    }

    private void revokeActiveShare(TaskShareEntity share) {
        share.setActive(false);
        share.setRevokedAt(Instant.now());
        taskShareRepository.save(share);
    }

    private TaskShareSummaryResponse toSummary(TaskShareEntity entity) {
        ShareMode mode = ShareMode.parse(entity.getAccessMode());
        return new TaskShareSummaryResponse(
                entity.getId(),
                entity.getTaskAnalysisId(),
                mode.value(),
                entity.getShareToken(),
                mode.shareUrl(entity.getShareToken()),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getRevokedAt()
        );
    }

    private ShareMode parseMode(String requestedMode) {
        try {
            return ShareMode.parse(requestedMode);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    private enum ShareMode {
        VIEW("view"),
        PRESENT("present");

        private final String value;

        ShareMode(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }

        public String shareUrl(String token) {
            return this == PRESENT
                    ? "/shared/" + token + "/present"
                    : "/shared/" + token;
        }

        private static ShareMode parse(String rawValue) {
            if (rawValue == null || rawValue.isBlank()) {
                throw new IllegalArgumentException("Share mode is required");
            }

            String normalized = rawValue.trim().toLowerCase(Locale.ROOT);
            for (ShareMode candidate : values()) {
                if (candidate.value.equals(normalized)) {
                    return candidate;
                }
            }

            throw new IllegalArgumentException("Unsupported share mode");
        }
    }
}
