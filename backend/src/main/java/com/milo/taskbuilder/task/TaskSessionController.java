package com.milo.taskbuilder.task;

import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.task.dto.CreateTaskSessionRequest;
import com.milo.taskbuilder.task.dto.TaskSessionSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/{taskId}/sessions")
public class TaskSessionController {

    private final TaskSessionService taskSessionService;

    public TaskSessionController(TaskSessionService taskSessionService) {
        this.taskSessionService = taskSessionService;
    }

    @PostMapping
    public ResponseEntity<TaskSessionSummaryResponse> createOwnerSession(
            Authentication authentication,
            @PathVariable UUID taskId,
            @RequestBody(required = false) CreateTaskSessionRequest request
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TaskSessionSummaryResponse created =
                taskSessionService.createOwnerSession(taskId, principal.getLocalUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TaskSessionSummaryResponse>> listOwnerSessions(
            Authentication authentication,
            @PathVariable UUID taskId
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(taskSessionService.listOwnerSessions(taskId, principal.getLocalUserId()));
    }

    private TaskBuilderPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof TaskBuilderPrincipal principal)) {
            return null;
        }
        return principal;
    }
}
