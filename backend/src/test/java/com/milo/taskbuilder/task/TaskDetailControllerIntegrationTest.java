package com.milo.taskbuilder.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.TaskLibraryController;
import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskLibraryController.class)
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
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void returnsTaskDetailForAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskDetailResponse detail = detailResponse();

        when(taskDetailService.getTaskDetail(detail.id(), principal.getLocalUserId())).thenReturn(detail);

        mockMvc.perform(get("/api/tasks/{taskId}", detail.id()).principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(detail.id().toString()))
                .andExpect(jsonPath("$.description").value(detail.description()))
                .andExpect(jsonPath("$.environmentLabel").value(detail.environmentLabel()))
                .andExpect(jsonPath("$.steps[0].title").value("Apri l'acqua"))
                .andExpect(jsonPath("$.steps[0].required").value(true))
                .andExpect(jsonPath("$.steps[0].supportGuidance").value("Indicazione verbale breve"))
                .andExpect(jsonPath("$.steps[1].position").value(2));
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
                                1
                        ),
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                "Modello visivo",
                                null,
                                2
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
                .andExpect(jsonPath("$.steps[1].id").value("22222222-2222-2222-2222-222222222222"))
                .andExpect(jsonPath("$.stepCount").value(2));

        verify(taskDetailService).updateTask(eq(response.id()), eq(principal.getLocalUserId()), any(UpdateTaskRequest.class));
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
                null,
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
                                1
                        ),
                        new TaskDetailResponse.TaskStepDetail(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone",
                                false,
                                "Modello visivo",
                                null,
                                2
                        )
                )
        );
    }
}
