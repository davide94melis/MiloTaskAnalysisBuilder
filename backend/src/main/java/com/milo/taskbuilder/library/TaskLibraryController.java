package com.milo.taskbuilder.library;

import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.dto.CreateTaskRequest;
import com.milo.taskbuilder.library.dto.DashboardResponse;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryResponse;
import com.milo.taskbuilder.task.TaskDetailService;
import com.milo.taskbuilder.task.TaskShellService;
import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class TaskLibraryController {

    private final TaskShellService taskShellService;
    private TaskDetailService taskDetailService;

    @Autowired
    public TaskLibraryController(TaskShellService taskShellService, TaskDetailService taskDetailService) {
        this.taskShellService = taskShellService;
        this.taskDetailService = taskDetailService;
    }

    @GetMapping("/tasks/dashboard")
    public ResponseEntity<DashboardResponse> dashboard(Authentication authentication) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskShellService.getDashboard(principal.getLocalUserId()));
    }

    @GetMapping("/tasks")
    public ResponseEntity<TaskLibraryResponse> listLibrary(
            Authentication authentication,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String context,
            @RequestParam(required = false) String targetLabel,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String supportLevel,
            @RequestParam(required = false) String search
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TaskShellService.TaskLibraryFilter filter = new TaskShellService.TaskLibraryFilter(
                category,
                context,
                targetLabel,
                author,
                status,
                supportLevel,
                search
        );
        return ResponseEntity.ok(taskShellService.listLibrary(principal.getLocalUserId(), filter));
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskCardResponse> createTask(
            Authentication authentication,
            @RequestBody(required = false) CreateTaskRequest request
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        CreateTaskRequest payload = request == null ? new CreateTaskRequest(null, null) : request;
        TaskCardResponse created = taskShellService.createDraft(
                principal.getLocalUserId(),
                principal.getEmail(),
                payload
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDetailResponse> reopenTask(
            Authentication authentication,
            @PathVariable UUID taskId
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskDetailService.getTaskDetail(taskId, principal.getLocalUserId()));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDetailResponse> updateTask(
            Authentication authentication,
            @PathVariable UUID taskId,
            @RequestBody UpdateTaskRequest request
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskDetailService.updateTask(taskId, principal.getLocalUserId(), request));
    }

    @PostMapping("/tasks/{taskId}/duplicate")
    public ResponseEntity<TaskCardResponse> duplicateTask(
            Authentication authentication,
            @PathVariable UUID taskId
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        TaskCardResponse duplicated = taskShellService.duplicate(taskId, principal.getLocalUserId(), principal.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<TaskCardResponse>> listTemplates(Authentication authentication) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskShellService.listTemplates());
    }

    private TaskBuilderPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof TaskBuilderPrincipal principal)) {
            return null;
        }
        return principal;
    }
}
