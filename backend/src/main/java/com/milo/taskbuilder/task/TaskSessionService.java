package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.CreateTaskSessionRequest;
import com.milo.taskbuilder.task.dto.TaskSessionSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class TaskSessionService {

    private static final String OWNER_PRESENT = "owner_present";
    private static final String SHARED_PRESENT = "shared_present";
    private static final String PRESENT = "present";

    private final TaskSessionRepository taskSessionRepository;
    private final TaskShellRepository taskShellRepository;
    private final TaskShareRepository taskShareRepository;

    public TaskSessionService(
            TaskSessionRepository taskSessionRepository,
            TaskShellRepository taskShellRepository,
            TaskShareRepository taskShareRepository
    ) {
        this.taskSessionRepository = taskSessionRepository;
        this.taskShellRepository = taskShellRepository;
        this.taskShareRepository = taskShareRepository;
    }

    @Transactional
    public TaskSessionSummaryResponse createOwnerSession(
            UUID taskId,
            UUID ownerId,
            CreateTaskSessionRequest request
    ) {
        TaskShellEntity task = ownedTask(taskId, ownerId);
        TaskSessionEntity session = new TaskSessionEntity();
        session.setTaskAnalysisId(task.getId());
        session.setOwnerId(ownerId);
        session.setAccessContext(OWNER_PRESENT);
        session.setStepCount(validatedStepCount(request));
        session.setCompleted(validatedCompleted(request));
        return toResponse(taskSessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<TaskSessionSummaryResponse> listOwnerSessions(UUID taskId, UUID ownerId) {
        ownedTask(taskId, ownerId);
        return taskSessionRepository.findByTaskAnalysisIdAndOwnerIdOrderByCompletedAtDescIdDesc(taskId, ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TaskSessionSummaryResponse createSharedPresentSession(
            String token,
            CreateTaskSessionRequest request
    ) {
        TaskShareEntity share = taskShareRepository.findByShareTokenAndAccessModeAndActiveTrue(token, PRESENT)
                .orElseThrow(this::sharedNotFound);

        taskShellRepository.findById(share.getTaskAnalysisId())
                .orElseThrow(this::sharedNotFound);

        TaskSessionEntity session = new TaskSessionEntity();
        session.setTaskAnalysisId(share.getTaskAnalysisId());
        session.setOwnerId(share.getOwnerId());
        session.setTaskShareId(share.getId());
        session.setAccessContext(SHARED_PRESENT);
        session.setStepCount(validatedStepCount(request));
        session.setCompleted(validatedCompleted(request));
        return toResponse(taskSessionRepository.save(session));
    }

    private TaskShellEntity ownedTask(UUID taskId, UUID ownerId) {
        return taskShellRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private int validatedStepCount(CreateTaskSessionRequest request) {
        if (request == null || request.stepCount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Step count is required");
        }
        if (request.stepCount() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Step count must be zero or greater");
        }
        return request.stepCount();
    }

    private boolean validatedCompleted(CreateTaskSessionRequest request) {
        if (request == null || request.completed() == null) {
            return true;
        }
        if (!request.completed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimal sessions must be completed");
        }
        return true;
    }

    private TaskSessionSummaryResponse toResponse(TaskSessionEntity session) {
        return new TaskSessionSummaryResponse(
                session.getId(),
                session.getTaskAnalysisId(),
                session.getOwnerId(),
                session.getTaskShareId(),
                session.getAccessContext(),
                session.getStepCount(),
                session.isCompleted(),
                session.getCompletedAt()
        );
    }

    private ResponseStatusException sharedNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found");
    }
}
