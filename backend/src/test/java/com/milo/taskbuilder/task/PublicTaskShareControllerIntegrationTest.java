package com.milo.taskbuilder.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.SecurityConfig;
import com.milo.taskbuilder.auth.TaskBuilderAuthenticationFilter;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.TaskLibraryController;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.task.dto.PublicSharedPresentResponse;
import com.milo.taskbuilder.task.dto.PublicSharedTaskResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({PublicTaskShareController.class, TaskLibraryController.class})
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, TaskBuilderAuthenticationFilter.class})
class PublicTaskShareControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PublicTaskShareService publicTaskShareService;

    @MockitoBean
    private TaskShellService taskShellService;

    @MockitoBean
    private TaskDetailService taskDetailService;

    @MockitoBean
    private TaskShareService taskShareService;

    @MockitoBean
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void allowsAnonymousSharedViewWithoutLeakingOwnerFields() throws Exception {
        PublicSharedTaskResponse response = sharedTaskResponse();

        when(publicTaskShareService.getSharedTask("sharetokenview")).thenReturn(response);

        mockMvc.perform(get("/api/public/shares/{token}", "sharetokenview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(response.taskId().toString()))
                .andExpect(jsonPath("$.title").value(response.title()))
                .andExpect(jsonPath("$.category").value(response.category()))
                .andExpect(jsonPath("$.description").value(response.description()))
                .andExpect(jsonPath("$.stepCount").value(2))
                .andExpect(jsonPath("$.steps[0].title").value("Apri l'acqua"))
                .andExpect(jsonPath("$.steps[0].required").value(true))
                .andExpect(jsonPath("$.steps[0].visualSupport.image.url")
                        .value("/api/public/shares/sharetokenview/media/aaaaaaaa-1111-1111-1111-111111111111/content"))
                .andExpect(jsonPath("$.professionalNotes").doesNotExist())
                .andExpect(jsonPath("$.authorName").doesNotExist())
                .andExpect(jsonPath("$.visibility").doesNotExist())
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.targetLabel").doesNotExist())
                .andExpect(jsonPath("$.sourceTaskId").doesNotExist())
                .andExpect(jsonPath("$.variantFamilyId").doesNotExist())
                .andExpect(jsonPath("$.steps[0].supportGuidance").doesNotExist())
                .andExpect(jsonPath("$.steps[0].reinforcementNotes").doesNotExist())
                .andExpect(jsonPath("$.steps[0].estimatedMinutes").doesNotExist())
                .andExpect(jsonPath("$.steps[0].visualSupport.image.storageKey").doesNotExist());
    }

    @Test
    void allowsAnonymousSharedPresentWithSafeContract() throws Exception {
        PublicSharedPresentResponse response = sharedPresentResponse();

        when(publicTaskShareService.getSharedPresent("sharetokenpresent")).thenReturn(response);

        mockMvc.perform(get("/api/public/shares/{token}/present", "sharetokenpresent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(response.taskId().toString()))
                .andExpect(jsonPath("$.title").value(response.title()))
                .andExpect(jsonPath("$.steps[0].title").value("Apri l'acqua"))
                .andExpect(jsonPath("$.steps[0].visualSupport.text").value("Apri"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.key").value("soap"))
                .andExpect(jsonPath("$.category").doesNotExist())
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.steps[0].supportGuidance").doesNotExist())
                .andExpect(jsonPath("$.steps[0].reinforcementNotes").doesNotExist())
                .andExpect(jsonPath("$.steps[0].estimatedMinutes").doesNotExist());
    }

    @Test
    void servesAnonymousSharedMediaThroughShareRoute() throws Exception {
        UUID mediaId = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");

        when(publicTaskShareService.loadSharedMedia("sharetokenview", mediaId))
                .thenReturn(new TaskMediaStorageService.StoredTaskMediaContent(
                        new byte[]{1, 2, 3},
                        MediaType.IMAGE_PNG_VALUE,
                        "step.png"
                ));

        mockMvc.perform(get("/api/public/shares/{token}/media/{mediaId}/content", "sharetokenview", mediaId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andExpect(content().bytes(new byte[]{1, 2, 3}))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("step.png")));
    }

    @Test
    void keepsAuthenticatedTaskRoutesProtectedWhilePublicShareRoutesStayAnonymous() throws Exception {
        when(publicTaskShareService.getSharedTask("sharetokenview")).thenReturn(sharedTaskResponse());

        mockMvc.perform(get("/api/public/shares/{token}", "sharetokenview"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tasks/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsAnonymousDuplicateFromShare() throws Exception {
        mockMvc.perform(post("/api/public/shares/{token}/duplicate", "sharetokenview"))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicatesActiveShareForAuthenticatedRecipient() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskCardResponse duplicated = new TaskCardResponse(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                "Lavarsi le mani",
                "Autonomia personale",
                null,
                "Guidato",
                "Bagno",
                "private",
                "draft",
                2,
                principal.getEmail(),
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Instant.parse("2026-03-14T07:00:00Z")
        );

        when(publicTaskShareService.duplicateSharedTask("sharetokenview", principal.getLocalUserId(), principal.getEmail()))
                .thenReturn(duplicated);

        mockMvc.perform(post("/api/public/shares/{token}/duplicate", "sharetokenview")
                        .with(authentication(authenticationToken(principal))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(duplicated.id().toString()))
                .andExpect(jsonPath("$.visibility").value("private"))
                .andExpect(jsonPath("$.status").value("draft"))
                .andExpect(jsonPath("$.authorName").value(principal.getEmail()));
    }

    @Test
    void returnsNotFoundForInvalidOrRevokedSharedRoutes() throws Exception {
        when(publicTaskShareService.getSharedTask("revoked"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found"));
        when(publicTaskShareService.loadSharedMedia("revoked", UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111")))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found"));

        mockMvc.perform(get("/api/public/shares/{token}", "revoked"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/public/shares/{token}/media/{mediaId}/content",
                        "revoked",
                        UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111")))
                .andExpect(status().isNotFound());
    }

    @Test
    void serviceRejectsMediaWhenNotAttachedToCurrentStep() {
        TaskShareRepository shareRepository = mock(TaskShareRepository.class);
        TaskShellRepository taskShellRepository = mock(TaskShellRepository.class);
        TaskAnalysisStepRepository stepRepository = mock(TaskAnalysisStepRepository.class);
        TaskAnalysisStepMediaRepository mediaRepository = mock(TaskAnalysisStepMediaRepository.class);
        PublicTaskShareService service = new PublicTaskShareService(
                shareRepository,
                taskShellRepository,
                stepRepository,
                mediaRepository,
                mock(PublicTaskDetailMapper.class),
                mock(TaskMediaStorageService.class),
                mock(TaskShellService.class)
        );

        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID mediaId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        when(shareRepository.findByShareTokenAndActiveTrue("sharetokenview"))
                .thenReturn(Optional.of(activeShare(taskId, "view", "sharetokenview")));
        when(mediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId))
                .thenReturn(Optional.of(media(mediaId, taskId, UUID.fromString("99999999-9999-9999-9999-999999999999"))));
        when(stepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId))
                .thenReturn(List.of(step(taskId, UUID.fromString("11111111-1111-1111-1111-111111111111"), 1)));

        ResponseStatusException thrown =
                assertThrows(ResponseStatusException.class, () -> service.loadSharedMedia("sharetokenview", mediaId));

        assertThat(thrown.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void serviceLoadsSharedMediaOnlyForActiveShareAndCurrentAttachment() {
        TaskShareRepository shareRepository = mock(TaskShareRepository.class);
        TaskShellRepository taskShellRepository = mock(TaskShellRepository.class);
        TaskAnalysisStepRepository stepRepository = mock(TaskAnalysisStepRepository.class);
        TaskAnalysisStepMediaRepository mediaRepository = mock(TaskAnalysisStepMediaRepository.class);
        TaskMediaStorageService mediaStorageService = mock(TaskMediaStorageService.class);
        PublicTaskShareService service = new PublicTaskShareService(
                shareRepository,
                taskShellRepository,
                stepRepository,
                mediaRepository,
                mock(PublicTaskDetailMapper.class),
                mediaStorageService,
                mock(TaskShellService.class)
        );

        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID mediaId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID stepId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        TaskMediaStorageService.StoredTaskMediaContent content =
                new TaskMediaStorageService.StoredTaskMediaContent(new byte[]{9}, MediaType.IMAGE_PNG_VALUE, "step.png");

        when(shareRepository.findByShareTokenAndActiveTrue("sharetokenview"))
                .thenReturn(Optional.of(activeShare(taskId, "view", "sharetokenview")));
        when(mediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId))
                .thenReturn(Optional.of(media(mediaId, taskId, stepId)));
        when(stepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId))
                .thenReturn(List.of(step(taskId, stepId, 1)));
        when(mediaStorageService.loadSharedMedia(taskId, mediaId)).thenReturn(content);

        TaskMediaStorageService.StoredTaskMediaContent actual = service.loadSharedMedia("sharetokenview", mediaId);

        assertThat(actual).isEqualTo(content);
        verify(mediaStorageService).loadSharedMedia(taskId, mediaId);
    }

    @Test
    void serviceDuplicatesFromActiveShareIntoPrivateDraft() {
        TaskShareRepository shareRepository = mock(TaskShareRepository.class);
        TaskShellRepository taskShellRepository = mock(TaskShellRepository.class);
        TaskShellService taskShellService = mock(TaskShellService.class);
        PublicTaskShareService service = new PublicTaskShareService(
                shareRepository,
                taskShellRepository,
                mock(TaskAnalysisStepRepository.class),
                mock(TaskAnalysisStepMediaRepository.class),
                mock(PublicTaskDetailMapper.class),
                mock(TaskMediaStorageService.class),
                taskShellService
        );

        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID recipientId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        TaskShellEntity sharedTask = task(taskId);
        TaskCardResponse duplicated = new TaskCardResponse(
                UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                sharedTask.getTitle(),
                sharedTask.getCategory(),
                null,
                sharedTask.getSupportLevel(),
                sharedTask.getContextLabel(),
                "private",
                "draft",
                sharedTask.getStepCount(),
                "recipient@example.com",
                taskId,
                Instant.parse("2026-03-14T07:15:00Z")
        );

        when(shareRepository.findByShareTokenAndActiveTrue("sharetokenview"))
                .thenReturn(Optional.of(activeShare(taskId, "view", "sharetokenview")));
        when(taskShellRepository.findById(taskId)).thenReturn(Optional.of(sharedTask));
        when(taskShellService.duplicateSharedTask(sharedTask, recipientId, "recipient@example.com"))
                .thenReturn(duplicated);

        TaskCardResponse actual = service.duplicateSharedTask("sharetokenview", recipientId, "recipient@example.com");

        assertThat(actual.visibility()).isEqualTo("private");
        assertThat(actual.status()).isEqualTo("draft");
        assertThat(actual.authorName()).isEqualTo("recipient@example.com");
        verify(taskShellService).duplicateSharedTask(sharedTask, recipientId, "recipient@example.com");
    }

    private PublicSharedTaskResponse sharedTaskResponse() {
        return new PublicSharedTaskResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Lavarsi le mani",
                "Autonomia personale",
                "Sequenza guidata per l'igiene",
                2,
                Instant.parse("2026-03-14T06:55:00Z"),
                List.of(
                        new PublicSharedTaskResponse.SharedTaskStep(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri l'acqua",
                                "Aprire il rubinetto",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "Apri",
                                        null,
                                        new PublicSharedTaskResponse.SharedStepImage(
                                                UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"),
                                                "step-1.png",
                                                "image/png",
                                                1024,
                                                320,
                                                240,
                                                "Apri il rubinetto",
                                                "/api/public/shares/sharetokenview/media/aaaaaaaa-1111-1111-1111-111111111111/content"
                                        )
                                )
                        ),
                        new PublicSharedTaskResponse.SharedTaskStep(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "Insapona",
                                        new PublicSharedTaskResponse.SharedStepSymbol("arasaac", "soap", "Sapone"),
                                        null
                                )
                        )
                )
        );
    }

    private PublicSharedPresentResponse sharedPresentResponse() {
        return new PublicSharedPresentResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Lavarsi le mani",
                2,
                List.of(
                        new PublicSharedPresentResponse.PresentStep(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri l'acqua",
                                "Aprire il rubinetto",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "Apri",
                                        null,
                                        new PublicSharedTaskResponse.SharedStepImage(
                                                UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"),
                                                "step-1.png",
                                                "image/png",
                                                1024,
                                                320,
                                                240,
                                                "Apri il rubinetto",
                                                "/api/public/shares/sharetokenpresent/media/aaaaaaaa-1111-1111-1111-111111111111/content"
                                        )
                                )
                        ),
                        new PublicSharedPresentResponse.PresentStep(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "Insapona",
                                        new PublicSharedTaskResponse.SharedStepSymbol("arasaac", "soap", "Sapone"),
                                        null
                                )
                        )
                )
        );
    }

    private TaskBuilderPrincipal principal() {
        return new TaskBuilderPrincipal(UUID.randomUUID(), UUID.randomUUID(), "teacher@example.com");
    }

    private UsernamePasswordAuthenticationToken authenticationToken(TaskBuilderPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private TaskShareEntity activeShare(UUID taskId, String mode, String token) {
        TaskShareEntity share = new TaskShareEntity();
        share.setId(UUID.randomUUID());
        share.setTaskAnalysisId(taskId);
        share.setOwnerId(UUID.fromString("99999999-9999-9999-9999-999999999999"));
        share.setAccessMode(mode);
        share.setShareToken(token);
        share.setActive(true);
        return share;
    }

    private TaskAnalysisStepEntity step(UUID taskId, UUID stepId, int position) {
        TaskAnalysisStepEntity step = new TaskAnalysisStepEntity();
        step.setId(stepId);
        step.setTaskAnalysisId(taskId);
        step.setPosition(position);
        step.setTitle("Step " + position);
        step.setRequired(true);
        step.setVisualText("Visual " + position);
        return step;
    }

    private TaskAnalysisStepMediaEntity media(UUID mediaId, UUID taskId, UUID stepId) {
        TaskAnalysisStepMediaEntity media = new TaskAnalysisStepMediaEntity();
        media.setId(mediaId);
        media.setTaskAnalysisId(taskId);
        media.setTaskAnalysisStepId(stepId);
        media.setKind("image");
        media.setStorageProvider("filesystem");
        media.setStorageBucket("task-step-media");
        media.setStorageKey("task/image.png");
        media.setMimeType(MediaType.IMAGE_PNG_VALUE);
        media.setFileSizeBytes(123);
        return media;
    }

    private TaskShellEntity task(UUID taskId) {
        TaskShellEntity task = new TaskShellEntity();
        task.setId(taskId);
        task.setOwnerId(UUID.fromString("99999999-9999-9999-9999-999999999999"));
        task.setTitle("Lavarsi le mani");
        task.setCategory("Autonomia personale");
        task.setDescription("Sequenza guidata per l'igiene");
        task.setSupportLevel("Guidato");
        task.setContextLabel("Bagno");
        task.setStepCount(2);
        task.setVisibility(TaskShellVisibility.PRIVATE);
        task.setStatus(TaskShellStatus.DRAFT);
        return task;
    }
}
