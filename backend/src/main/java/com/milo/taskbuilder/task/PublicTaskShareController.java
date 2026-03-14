package com.milo.taskbuilder.task;

import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.task.dto.PublicSharedPresentResponse;
import com.milo.taskbuilder.task.dto.PublicSharedTaskResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/shares")
public class PublicTaskShareController {

    private final PublicTaskShareService publicTaskShareService;

    public PublicTaskShareController(PublicTaskShareService publicTaskShareService) {
        this.publicTaskShareService = publicTaskShareService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicSharedTaskResponse> loadSharedTask(@PathVariable String token) {
        return ResponseEntity.ok(publicTaskShareService.getSharedTask(token));
    }

    @GetMapping("/{token}/present")
    public ResponseEntity<PublicSharedPresentResponse> loadSharedPresent(@PathVariable String token) {
        return ResponseEntity.ok(publicTaskShareService.getSharedPresent(token));
    }

    @GetMapping("/{token}/media/{mediaId}/content")
    public ResponseEntity<byte[]> loadSharedMedia(
            @PathVariable String token,
            @PathVariable UUID mediaId
    ) {
        TaskMediaStorageService.StoredTaskMediaContent content =
                publicTaskShareService.loadSharedMedia(token, mediaId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.mimeType()));
        if (content.fileName() != null) {
            headers.setContentDisposition(ContentDisposition.inline().filename(content.fileName()).build());
        }

        return new ResponseEntity<>(content.bytes(), headers, HttpStatus.OK);
    }

    @PostMapping("/{token}/duplicate")
    public ResponseEntity<TaskCardResponse> duplicateSharedTask(
            Authentication authentication,
            @PathVariable String token
    ) {
        TaskBuilderPrincipal principal = principal(authentication);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TaskCardResponse duplicated =
                publicTaskShareService.duplicateSharedTask(token, principal.getLocalUserId(), principal.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    private TaskBuilderPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof TaskBuilderPrincipal principal)) {
            return null;
        }
        return principal;
    }
}
