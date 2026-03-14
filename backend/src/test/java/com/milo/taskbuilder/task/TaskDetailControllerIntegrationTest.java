package com.milo.taskbuilder.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.TaskLibraryController;
import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.TaskMediaUploadResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({TaskLibraryController.class, TaskMediaController.class})
@AutoConfigureMockMvc(addFilters = false)
class TaskDetailControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskShellService taskShellService;

    @MockitoBean
    private TaskDetailService taskDetailService;

    @MockitoBean
    private TaskShareService taskShareService;

    @MockitoBean
    private TaskMediaStorageService taskMediaStorageService;

    @MockitoBean
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void returnsTaskDetailContractForAuthenticatedGuidedPresentMode() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskDetailResponse detail = detailResponse();

        when(taskDetailService.getTaskDetail(detail.id(), principal.getLocalUserId())).thenReturn(detail);

        mockMvc.perform(get("/api/tasks/{taskId}", detail.id()).principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(detail.id().toString()))
                .andExpect(jsonPath("$.title").value(detail.title()))
                .andExpect(jsonPath("$.supportLevel").value(detail.supportLevel()))
                .andExpect(jsonPath("$.description").value(detail.description()))
                .andExpect(jsonPath("$.environmentLabel").value(detail.environmentLabel()))
                .andExpect(jsonPath("$.variantRole").value("variant"))
                .andExpect(jsonPath("$.variantRootTitle").value("Lavarsi le mani"))
                .andExpect(jsonPath("$.variantRootTaskId").value("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .andExpect(jsonPath("$.relatedVariants.length()").value(2))
                .andExpect(jsonPath("$.relatedVariants[0].id").value("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .andExpect(jsonPath("$.relatedVariants[0].variantRole").value("root"))
                .andExpect(jsonPath("$.relatedVariants[1].id").value("cccccccc-cccc-cccc-cccc-cccccccccccc"))
                .andExpect(jsonPath("$.relatedVariants[1].supportLevel").value("Autonomo"))
                .andExpect(jsonPath("$.steps.length()").value(2))
                .andExpect(jsonPath("$.steps[0].id").value("11111111-1111-1111-1111-111111111111"))
                .andExpect(jsonPath("$.steps[0].position").value(1))
                .andExpect(jsonPath("$.steps[0].title").value("Apri l'acqua"))
                .andExpect(jsonPath("$.steps[0].description").value("Aprire il rubinetto"))
                .andExpect(jsonPath("$.steps[0].required").value(true))
                .andExpect(jsonPath("$.steps[0].supportGuidance").value("Indicazione verbale breve"))
                .andExpect(jsonPath("$.steps[0].reinforcementNotes").value("Lode immediata"))
                .andExpect(jsonPath("$.steps[0].estimatedMinutes").value(1))
                .andExpect(jsonPath("$.steps[0].visualSupport.text").value("Apri"))
                .andExpect(jsonPath("$.steps[0].visualSupport.image.storageKey").value("task-1/image-1.png"))
                .andExpect(jsonPath("$.steps[0].visualSupport.image.mediaId")
                        .value("aaaaaaaa-1111-1111-1111-111111111111"))
                .andExpect(jsonPath("$.steps[0].visualSupport.image.url")
                        .value("/api/tasks/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/media/aaaaaaaa-1111-1111-1111-111111111111/content"))
                .andExpect(jsonPath("$.steps[1].id").value("22222222-2222-2222-2222-222222222222"))
                .andExpect(jsonPath("$.steps[1].position").value(2))
                .andExpect(jsonPath("$.steps[1].required").value(false))
                .andExpect(jsonPath("$.steps[1].visualSupport.text").value("Insapona"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.key").value("soap"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.label").value("Sapone"))
                .andExpect(jsonPath("$.steps[1].visualSupport.image").doesNotExist());
    }

    @Test
    void updatesTaskDetailAndPreservesStepOrder() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskDetailResponse response = detailResponse();
        UpdateTaskRequest request = new UpdateTaskRequest(
                "Lavarsi le mani",
                "Autonomia personale",
                "Descrizione",
                "Obiettivo",
                "Nota",
                "Bambino",
                "Guidato",
                "Intermedio",
                "Bagno",
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri l'acqua",
                                "Aprire il rubinetto",
                                true,
                                "Indicazione verbale breve",
                                "Lode immediata",
                                1,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Apri",
                                        null,
                                        new UpdateTaskRequest.StepImageRequest(
                                                UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"),
                                                "task-1/image-1.png",
                                                "step-1.png",
                                                "image/png",
                                                1024L,
                                                320,
                                                240,
                                                "Apri il rubinetto",
                                                "/api/tasks/%s/media/%s/content".formatted(
                                                        response.id(),
                                                        UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111")
                                                )
                                        )
                                )
                        ),
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                "Modello visivo",
                                null,
                                2,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Insapona",
                                        new UpdateTaskRequest.StepSymbolRequest("arasaac", "soap", "Sapone"),
                                        null
                                )
                        )
                )
        );

        when(taskDetailService.updateTask(eq(response.id()), eq(principal.getLocalUserId()), any(UpdateTaskRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/tasks/{taskId}", response.id())
                        .principal(authentication(principal))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(response.title()))
                .andExpect(jsonPath("$.steps[0].id").value("11111111-1111-1111-1111-111111111111"))
                .andExpect(jsonPath("$.steps[0].estimatedMinutes").value(1))
                .andExpect(jsonPath("$.steps[0].visualSupport.image.storageKey").value("task-1/image-1.png"))
                .andExpect(jsonPath("$.steps[1].id").value("22222222-2222-2222-2222-222222222222"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.key").value("soap"))
                .andExpect(jsonPath("$.stepCount").value(2))
                .andExpect(jsonPath("$.variantCount").value(3))
                .andExpect(jsonPath("$.relatedVariants[0].title").value("Lavarsi le mani"));

        verify(taskDetailService).updateTask(eq(response.id()), eq(principal.getLocalUserId()), any(UpdateTaskRequest.class));
    }

    @Test
    void uploadsTaskMediaForAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID mediaId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        MockMultipartFile file = new MockMultipartFile("file", "step.png", "image/png", new byte[]{1, 2, 3});

        when(taskMediaStorageService.upload(eq(taskId), eq(principal.getLocalUserId()), any()))
                .thenReturn(new TaskMediaUploadResponse(
                        mediaId,
                        taskId,
                        "step.png",
                        "image/png",
                        3,
                        320,
                        240,
                        "task-1/step.png",
                        null,
                        "/api/tasks/%s/media/%s/content".formatted(taskId, mediaId)
                ));

        mockMvc.perform(multipart("/api/tasks/{taskId}/media/uploads", taskId)
                        .file(file)
                        .principal(authentication(principal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaId").value(mediaId.toString()))
                .andExpect(jsonPath("$.storageKey").value("task-1/step.png"))
                .andExpect(jsonPath("$.url").value("/api/tasks/%s/media/%s/content".formatted(taskId, mediaId)));
    }

    @Test
    void returnsStoredTaskMediaContentForAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID mediaId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        when(taskMediaStorageService.loadOwnedMedia(taskId, mediaId, principal.getLocalUserId()))
                .thenReturn(new TaskMediaStorageService.StoredTaskMediaContent(
                        new byte[]{1, 2, 3},
                        MediaType.IMAGE_PNG_VALUE,
                        "step.png"
                ));

        mockMvc.perform(get("/api/tasks/{taskId}/media/{mediaId}/content", taskId, mediaId)
                        .principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
    }

    private TaskBuilderPrincipal principal() {
        return new TaskBuilderPrincipal(UUID.randomUUID(), UUID.randomUUID(), "teacher@example.com");
    }

    private UsernamePasswordAuthenticationToken authentication(TaskBuilderPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private TaskDetailResponse detailResponse() {
        return new TaskDetailResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Lavarsi le mani",
                "Autonomia personale",
                "Sequenza guidata per l'igiene",
                "Favorire autonomia",
                "Nota professionale",
                "Bagno",
                "Bambino",
                "Guidato",
                "Intermedio",
                "Bagno",
                "private",
                "draft",
                2,
                "teacher@example.com",
                UUID.fromString("99999999-9999-9999-9999-999999999999"),
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Lavarsi le mani",
                "variant",
                3,
                List.of(
                        new TaskDetailResponse.RelatedVariantSummary(
                                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                "Lavarsi le mani",
                                "Guidato",
                                "root",
                                Instant.parse("2026-03-13T12:10:00Z")
                        ),
                        new TaskDetailResponse.RelatedVariantSummary(
                                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                                "Lavarsi le mani",
                                "Autonomo",
                                "variant",
                                Instant.parse("2026-03-13T12:20:00Z")
                        )
                ),
                Instant.parse("2026-03-13T12:15:00Z"),
                List.of(
                        new TaskDetailResponse.TaskStepDetail(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri l'acqua",
                                "Aprire il rubinetto",
                                true,
                                "Indicazione verbale breve",
                                "Lode immediata",
                                1,
                                new TaskDetailResponse.VisualSupportDetail(
                                        "Apri",
                                        null,
                                        new TaskDetailResponse.StepImageDetail(
                                                UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"),
                                                "task-1/image-1.png",
                                                "step-1.png",
                                                "image/png",
                                                1024,
                                                320,
                                                240,
                                                "Apri il rubinetto",
                                                "/api/tasks/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/media/aaaaaaaa-1111-1111-1111-111111111111/content"
                                        )
                                )
                        ),
                        new TaskDetailResponse.TaskStepDetail(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                "Modello visivo",
                                null,
                                2,
                                new TaskDetailResponse.VisualSupportDetail(
                                        "Insapona",
                                        new TaskDetailResponse.StepSymbolDetail("arasaac", "soap", "Sapone"),
                                        null
                                )
                        )
                )
        );
    }
}
