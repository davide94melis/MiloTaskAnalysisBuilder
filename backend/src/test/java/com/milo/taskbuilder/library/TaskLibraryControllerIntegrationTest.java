package com.milo.taskbuilder.library;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.dto.CreateTaskRequest;
import com.milo.taskbuilder.library.dto.CreateTaskShareRequest;
import com.milo.taskbuilder.library.dto.DashboardResponse;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryFilterOptionsResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryResponse;
import com.milo.taskbuilder.task.TaskDetailService;
import com.milo.taskbuilder.task.TaskShareService;
import com.milo.taskbuilder.task.TaskShellService;
import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.TaskShareSummaryResponse;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskLibraryController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskLibraryControllerIntegrationTest {

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
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void returnsUnauthorizedWhenAuthenticationMissing() throws Exception {
        mockMvc.perform(get("/api/tasks/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void returnsUnauthorizedForShareManagementWhenAuthenticationMissing() throws Exception {
        mockMvc.perform(get("/api/tasks/{taskId}/shares", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createsDraftForAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskCardResponse card = card("Nuova task analysis", principal.getEmail(), "draft");

        when(taskShellService.createDraft(eq(principal.getLocalUserId()), eq(principal.getEmail()), any(CreateTaskRequest.class)))
                .thenReturn(card);

        mockMvc.perform(post("/api/tasks")
                        .principal(authentication(principal))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTaskRequest("Nuova task analysis", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(card.id().toString()))
                .andExpect(jsonPath("$.title").value(card.title()))
                .andExpect(jsonPath("$.status").value("draft"));
    }

    @Test
    void createsVariantForAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID sourceTaskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TaskCardResponse variant = new TaskCardResponse(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                "Routine del mattino",
                "Routine quotidiana",
                "Bambino",
                "Autonomo",
                "Casa",
                "private",
                "draft",
                6,
                principal.getEmail(),
                sourceTaskId,
                Instant.parse("2026-03-13T10:15:30Z"),
                sourceTaskId,
                sourceTaskId,
                "Routine del mattino",
                "variant",
                2
        );

        when(taskShellService.createVariant(eq(sourceTaskId), eq(principal.getLocalUserId()), eq(principal.getEmail()), any(CreateTaskRequest.class)))
                .thenReturn(variant);

        mockMvc.perform(post("/api/tasks")
                        .principal(authentication(principal))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTaskRequest("Routine del mattino", null, sourceTaskId, "Autonomo"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceTaskId").value(sourceTaskId.toString()))
                .andExpect(jsonPath("$.supportLevel").value("Autonomo"))
                .andExpect(jsonPath("$.variantFamilyId").value(sourceTaskId.toString()))
                .andExpect(jsonPath("$.variantRole").value("variant"));
    }

    @Test
    void rejectsVariantCreationWithoutSupportLevel() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID sourceTaskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        mockMvc.perform(post("/api/tasks")
                        .principal(authentication(principal))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTaskRequest("Routine del mattino", null, sourceTaskId, " "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listsLibraryUsingProvidedFilters() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskCardResponse draft = card("Preparare lo zaino", principal.getEmail(), "draft");
        TaskCardResponse template = card("Routine del mattino", "Milo", "template");

        when(taskShellService.listLibrary(eq(principal.getLocalUserId()), any(TaskShellService.TaskLibraryFilter.class)))
                .thenReturn(new TaskLibraryResponse(
                        List.of(draft, template),
                        new TaskLibraryFilterOptionsResponse(
                                List.of("Routine scolastica"),
                                List.of("Casa"),
                                List.of("Classe"),
                                List.of("Milo"),
                                List.of("draft", "template"),
                                List.of("Visivo")
                        )
                ));

        mockMvc.perform(get("/api/tasks")
                        .principal(authentication(principal))
                        .queryParam("category", "Routine scolastica")
                        .queryParam("context", "Casa")
                        .queryParam("targetLabel", "Classe")
                        .queryParam("author", "Milo")
                        .queryParam("status", "template")
                        .queryParam("supportLevel", "Visivo")
                        .queryParam("search", "routine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value(draft.title()))
                .andExpect(jsonPath("$.items[1].status").value(template.status()))
                .andExpect(jsonPath("$.availableFilters.categories[0]").value("Routine scolastica"));

        ArgumentCaptor<TaskShellService.TaskLibraryFilter> captor =
                ArgumentCaptor.forClass(TaskShellService.TaskLibraryFilter.class);
        verify(taskShellService).listLibrary(eq(principal.getLocalUserId()), captor.capture());
        assertThat(captor.getValue().category()).isEqualTo("Routine scolastica");
        assertThat(captor.getValue().context()).isEqualTo("Casa");
        assertThat(captor.getValue().targetLabel()).isEqualTo("Classe");
        assertThat(captor.getValue().author()).isEqualTo("Milo");
        assertThat(captor.getValue().status()).isEqualTo("template");
        assertThat(captor.getValue().supportLevel()).isEqualTo("Visivo");
        assertThat(captor.getValue().search()).isEqualTo("routine");
    }

    @Test
    void returnsDashboardWithDraftsAndTemplates() throws Exception {
        TaskBuilderPrincipal principal = principal();
        DashboardResponse response = new DashboardResponse(
                List.of(card("Bozza recente", principal.getEmail(), "draft")),
                List.of(card("Lavarsi le mani", "Milo", "template")),
                new DashboardResponse.DashboardStats(1, 1, 0)
        );

        when(taskShellService.getDashboard(principal.getLocalUserId())).thenReturn(response);

        mockMvc.perform(get("/api/tasks/dashboard").principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.draftCount").value(1))
                .andExpect(jsonPath("$.stats.templateCount").value(1))
                .andExpect(jsonPath("$.recentDrafts[0].title").value("Bozza recente"))
                .andExpect(jsonPath("$.seedTemplates[0].title").value("Lavarsi le mani"));
    }

    @Test
    void duplicatesAccessibleTaskIntoNewDraft() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskCardResponse duplicated = card("Routine del mattino", principal.getEmail(), "draft");

        when(taskShellService.duplicate(duplicated.id(), principal.getLocalUserId(), principal.getEmail()))
                .thenReturn(duplicated);

        mockMvc.perform(post("/api/tasks/{taskId}/duplicate", duplicated.id()).principal(authentication(principal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authorName").value(principal.getEmail()))
                .andExpect(jsonPath("$.status").value("draft"));
        verify(taskShellService).duplicate(duplicated.id(), principal.getLocalUserId(), principal.getEmail());
    }

    @Test
    void createsTaskShareForOwner() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TaskShareSummaryResponse share = shareSummary(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                taskId,
                "view",
                "sharetokenview",
                true,
                null
        );

        when(taskShareService.createShare(eq(taskId), eq(principal.getLocalUserId()), any(CreateTaskShareRequest.class)))
                .thenReturn(share);

        mockMvc.perform(post("/api/tasks/{taskId}/shares", taskId)
                        .principal(authentication(principal))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTaskShareRequest("view"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mode").value("view"))
                .andExpect(jsonPath("$.token").value("sharetokenview"))
                .andExpect(jsonPath("$.shareUrl").value("/shared/sharetokenview"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void listsActiveTaskSharesForOwner() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TaskShareSummaryResponse viewShare = shareSummary(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                taskId,
                "view",
                "sharetokenview",
                true,
                null
        );
        TaskShareSummaryResponse presentShare = shareSummary(
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                taskId,
                "present",
                "sharetokenpresent",
                true,
                null
        );

        when(taskShareService.listShares(taskId, principal.getLocalUserId()))
                .thenReturn(List.of(viewShare, presentShare));

        mockMvc.perform(get("/api/tasks/{taskId}/shares", taskId).principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].mode").value("view"))
                .andExpect(jsonPath("$[0].shareUrl").value("/shared/sharetokenview"))
                .andExpect(jsonPath("$[1].mode").value("present"))
                .andExpect(jsonPath("$[1].shareUrl").value("/shared/sharetokenpresent/present"));
    }

    @Test
    void regeneratesRequestedShareMode() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TaskShareSummaryResponse rotated = shareSummary(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                taskId,
                "view",
                "rotatedtoken",
                true,
                null
        );

        when(taskShareService.regenerateShare(taskId, principal.getLocalUserId(), "view"))
                .thenReturn(rotated);

        mockMvc.perform(post("/api/tasks/{taskId}/shares/{mode}/regenerate", taskId, "view")
                        .principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("view"))
                .andExpect(jsonPath("$.token").value("rotatedtoken"))
                .andExpect(jsonPath("$.shareUrl").value("/shared/rotatedtoken"));
    }

    @Test
    void revokesTaskShareForOwner() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID shareId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Instant revokedAt = Instant.parse("2026-03-14T06:30:00Z");
        TaskShareSummaryResponse revoked = shareSummary(shareId, taskId, "present", "sharetokenpresent", false, revokedAt);

        when(taskShareService.revokeShare(taskId, shareId, principal.getLocalUserId()))
                .thenReturn(revoked);

        mockMvc.perform(delete("/api/tasks/{taskId}/shares/{shareId}", taskId, shareId)
                        .principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("present"))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.revokedAt").value("2026-03-14T06:30:00Z"));
    }

    @Test
    void rejectsShareManagementForNonOwnerTask() throws Exception {
        TaskBuilderPrincipal principal = principal();
        UUID taskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        when(taskShareService.listShares(taskId, principal.getLocalUserId()))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        mockMvc.perform(get("/api/tasks/{taskId}/shares", taskId).principal(authentication(principal)))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsTaskDetailById() throws Exception {
        TaskBuilderPrincipal principal = principal();
        TaskDetailResponse reopened = detail("Task riapribile", principal.getEmail(), "draft");

        when(taskDetailService.getTaskDetail(reopened.id(), principal.getLocalUserId())).thenReturn(reopened);

        mockMvc.perform(get("/api/tasks/{taskId}", reopened.id()).principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reopened.id().toString()))
                .andExpect(jsonPath("$.title").value(reopened.title()))
                .andExpect(jsonPath("$.variantRole").value("root"))
                .andExpect(jsonPath("$.variantCount").value(2))
                .andExpect(jsonPath("$.relatedVariants[0].variantRole").value("variant"))
                .andExpect(jsonPath("$.steps[0].title").value("Apri il rubinetto"));
    }

    @Test
    void listsSeedTemplates() throws Exception {
        TaskBuilderPrincipal principal = principal();
        when(taskShellService.listTemplates()).thenReturn(List.of(card("Lavarsi le mani", "Milo", "template")));

        mockMvc.perform(get("/api/templates").principal(authentication(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("template"))
                .andExpect(jsonPath("$[0].authorName").value("Milo"));
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

    private TaskCardResponse card(String title, String authorName, String status) {
        return new TaskCardResponse(
                UUID.randomUUID(),
                title,
                "Routine quotidiana",
                "Bambino",
                "Visivo",
                "Casa",
                "template".equals(status) ? "template" : "private",
                status,
                6,
                authorName,
                null,
                Instant.parse("2026-03-13T10:15:30Z")
        );
    }

    private TaskDetailResponse detail(String title, String authorName, String status) {
        return new TaskDetailResponse(
                UUID.randomUUID(),
                title,
                "Routine quotidiana",
                "Sequenza per routine guidata",
                "Favorire autonomia",
                "Note per il team",
                "Casa",
                "Bambino",
                "Visivo",
                "Base",
                "Casa",
                "template".equals(status) ? "template" : "private",
                status,
                2,
                authorName,
                null,
                null,
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                title,
                "root",
                2,
                List.of(
                        new TaskDetailResponse.RelatedVariantSummary(
                                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                                title,
                                "Autonomo",
                                "variant",
                                Instant.parse("2026-03-13T10:25:30Z")
                        )
                ),
                Instant.parse("2026-03-13T10:15:30Z"),
                List.of(
                        new TaskDetailResponse.TaskStepDetail(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri il rubinetto",
                                "Apri l'acqua",
                                true,
                                "Prompt verbale",
                                "Lode",
                                1
                        ),
                        new TaskDetailResponse.TaskStepDetail(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Bagna le mani",
                                "Passa le mani sotto l'acqua",
                                false,
                                "Prompt visivo",
                                null,
                                2
                        )
                )
        );
    }

    private TaskShareSummaryResponse shareSummary(
            UUID shareId,
            UUID taskId,
            String mode,
            String token,
            boolean active,
            Instant revokedAt
    ) {
        return new TaskShareSummaryResponse(
                shareId,
                taskId,
                mode,
                token,
                "present".equals(mode) ? "/shared/" + token + "/present" : "/shared/" + token,
                active,
                Instant.parse("2026-03-14T06:15:00Z"),
                Instant.parse("2026-03-14T06:20:00Z"),
                revokedAt
        );
    }
}
