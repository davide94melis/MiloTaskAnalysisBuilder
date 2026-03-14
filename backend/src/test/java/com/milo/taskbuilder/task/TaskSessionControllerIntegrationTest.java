package com.milo.taskbuilder.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.SecurityConfig;
import com.milo.taskbuilder.auth.TaskBuilderAuthenticationFilter;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.task.dto.CreateTaskSessionRequest;
import com.milo.taskbuilder.task.dto.TaskSessionSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({TaskSessionController.class, PublicTaskShareController.class})
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, TaskBuilderAuthenticationFilter.class})
class TaskSessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskSessionService taskSessionService;

    @MockitoBean
    private PublicTaskShareService publicTaskShareService;

    @MockitoBean
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void createsOwnerSessionForAuthenticatedOwner() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TaskSessionSummaryResponse created = session(
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                taskId,
                principal.getLocalUserId(),
                null,
                "owner_present",
                7,
                Instant.parse("2026-03-14T08:00:00Z")
        );

        when(taskSessionService.createOwnerSession(eq(taskId), eq(principal.getLocalUserId()), eq(new CreateTaskSessionRequest(7, true))))
                .thenReturn(created);

        mockMvc.perform(post("/api/tasks/{taskId}/sessions", taskId)
                        .with(authentication(authenticationToken(principal)))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new CreateTaskSessionRequest(7, true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskId").value(taskId.toString()))
                .andExpect(jsonPath("$.ownerId").value(principal.getLocalUserId().toString()))
                .andExpect(jsonPath("$.shareId").doesNotExist())
                .andExpect(jsonPath("$.accessContext").value("owner_present"))
                .andExpect(jsonPath("$.stepCount").value(7))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void listsOwnerSessionsInHistoryOrder() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        List<TaskSessionSummaryResponse> sessions = List.of(
                session(
                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                        taskId,
                        principal.getLocalUserId(),
                        null,
                        "owner_present",
                        7,
                        Instant.parse("2026-03-14T08:05:00Z")
                ),
                session(
                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                        taskId,
                        principal.getLocalUserId(),
                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                        "shared_present",
                        7,
                        Instant.parse("2026-03-14T08:00:00Z")
                )
        );

        when(taskSessionService.listOwnerSessions(taskId, principal.getLocalUserId())).thenReturn(sessions);

        mockMvc.perform(get("/api/tasks/{taskId}/sessions", taskId)
                        .with(authentication(authenticationToken(principal))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("11111111-1111-1111-1111-111111111111"))
                .andExpect(jsonPath("$[0].completedAt").value("2026-03-14T08:05:00Z"))
                .andExpect(jsonPath("$[1].id").value("22222222-2222-2222-2222-222222222222"))
                .andExpect(jsonPath("$[1].shareId").value("33333333-3333-3333-3333-333333333333"));
    }

    @Test
    void rejectsAnonymousOwnerSessionRoutes() throws Exception {
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        mockMvc.perform(post("/api/tasks/{taskId}/sessions", taskId)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new CreateTaskSessionRequest(7, true))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/tasks/{taskId}/sessions", taskId))
                .andExpect(status().isForbidden());
    }

    @Test
    void createsSharedPresentSessionWithoutAuthentication() throws Exception {
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID ownerId = UUID.fromString("99999999-9999-9999-9999-999999999999");
        UUID shareId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        TaskSessionSummaryResponse created = session(
                UUID.fromString("55555555-5555-5555-5555-555555555555"),
                taskId,
                ownerId,
                shareId,
                "shared_present",
                7,
                Instant.parse("2026-03-14T08:10:00Z")
        );

        when(taskSessionService.createSharedPresentSession("sharetokenpresent", new CreateTaskSessionRequest(7, true)))
                .thenReturn(created);

        mockMvc.perform(post("/api/public/shares/{token}/sessions", "sharetokenpresent")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new CreateTaskSessionRequest(7, true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskId").value(taskId.toString()))
                .andExpect(jsonPath("$.ownerId").value(ownerId.toString()))
                .andExpect(jsonPath("$.shareId").value(shareId.toString()))
                .andExpect(jsonPath("$.accessContext").value("shared_present"));
    }

    @Test
    void rejectsSharedSessionCreationForWrongModeOrRevokedToken() throws Exception {
        when(taskSessionService.createSharedPresentSession("sharetokenview", new CreateTaskSessionRequest(7, true)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found"));
        when(taskSessionService.createSharedPresentSession("revoked", new CreateTaskSessionRequest(7, true)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared task not found"));

        mockMvc.perform(post("/api/public/shares/{token}/sessions", "sharetokenview")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new CreateTaskSessionRequest(7, true))))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/public/shares/{token}/sessions", "revoked")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(new CreateTaskSessionRequest(7, true))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deniesNonOwnerHistoryReads() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        when(taskSessionService.listOwnerSessions(taskId, principal.getLocalUserId()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        mockMvc.perform(get("/api/tasks/{taskId}/sessions", taskId)
                        .with(authentication(authenticationToken(principal))))
                .andExpect(status().isNotFound());

        verify(taskSessionService).listOwnerSessions(taskId, principal.getLocalUserId());
    }

    private TaskBuilderPrincipal principal() {
        return new TaskBuilderPrincipal(
                UUID.fromString("aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa"),
                UUID.fromString("bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb"),
                "teacher@example.com"
        );
    }

    private UsernamePasswordAuthenticationToken authenticationToken(TaskBuilderPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private TaskSessionSummaryResponse session(
            UUID id,
            UUID taskId,
            UUID ownerId,
            UUID shareId,
            String accessContext,
            int stepCount,
            Instant completedAt
    ) {
        return new TaskSessionSummaryResponse(
                id,
                taskId,
                ownerId,
                shareId,
                accessContext,
                stepCount,
                true,
                completedAt
        );
    }
}
