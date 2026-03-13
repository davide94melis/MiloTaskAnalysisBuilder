package com.milo.taskbuilder.task;

import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.task.dto.TaskMediaUploadResponse;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/{taskId}/media")
public class TaskMediaController {

    private final TaskMediaStorageService taskMediaStorageService;

    public TaskMediaController(TaskMediaStorageService taskMediaStorageService) {
        this.taskMediaStorageService = taskMediaStorageService;
    }

    @PostMapping(path = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TaskMediaUploadResponse> upload(
            Authentication authentication,
            @PathVariable UUID taskId,
            @RequestPart("file") MultipartFile file
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TaskMediaUploadResponse response = taskMediaStorageService.upload(taskId, principal.getLocalUserId(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{mediaId}/content")
    public ResponseEntity<byte[]> loadContent(
            Authentication authentication,
            @PathVariable UUID taskId,
            @PathVariable UUID mediaId
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TaskMediaStorageService.StoredTaskMediaContent content =
                taskMediaStorageService.loadOwnedMedia(taskId, mediaId, principal.getLocalUserId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.mimeType()));
        if (content.fileName() != null) {
            headers.setContentDisposition(ContentDisposition.inline().filename(content.fileName()).build());
        }

        return new ResponseEntity<>(content.bytes(), headers, HttpStatus.OK);
    }

    private TaskBuilderPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof TaskBuilderPrincipal principal)) {
            return null;
        }
        return principal;
    }
}
