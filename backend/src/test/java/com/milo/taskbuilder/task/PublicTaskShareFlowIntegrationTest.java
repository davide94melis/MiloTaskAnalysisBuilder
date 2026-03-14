package com.milo.taskbuilder.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.SecurityConfig;
import com.milo.taskbuilder.auth.TaskBuilderAuthenticationFilter;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.task.dto.PublicSharedPresentResponse;
import com.milo.taskbuilder.task.dto.PublicSharedTaskResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicTaskShareController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, TaskBuilderAuthenticationFilter.class})
class PublicTaskShareFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PublicTaskShareService publicTaskShareService;

    @MockitoBean
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void anonymousViewAndPresentRoutesExposeOnlySafeMixedSupportPayloads() throws Exception {
        when(publicTaskShareService.getSharedTask("view-token")).thenReturn(sharedViewResponse("view-token"));
        when(publicTaskShareService.getSharedPresent("present-token")).thenReturn(sharedPresentResponse("present-token"));

        mockMvc.perform(get("/api/public/shares/{token}", "view-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .andExpect(jsonPath("$.title").value("Routine mani"))
                .andExpect(jsonPath("$.category").value("Igiene"))
                .andExpect(jsonPath("$.steps[0].visualSupport.text").value("Apri"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.key").value("soap"))
                .andExpect(jsonPath("$.steps[2].visualSupport.image.url")
                        .value("/api/public/shares/view-token/media/cccccccc-3333-3333-3333-333333333333/content"))
                .andExpect(jsonPath("$.professionalNotes").doesNotExist())
                .andExpect(jsonPath("$.authorName").doesNotExist())
                .andExpect(jsonPath("$.steps[0].supportGuidance").doesNotExist())
                .andExpect(jsonPath("$.steps[2].visualSupport.image.storageKey").doesNotExist());

        mockMvc.perform(get("/api/public/shares/{token}/present", "present-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .andExpect(jsonPath("$.title").value("Routine mani"))
                .andExpect(jsonPath("$.stepCount").value(3))
                .andExpect(jsonPath("$.steps[0].visualSupport.text").value("Apri"))
                .andExpect(jsonPath("$.steps[1].visualSupport.symbol.label").value("Sapone"))
                .andExpect(jsonPath("$.steps[2].visualSupport.image.url")
                        .value("/api/public/shares/present-token/media/cccccccc-3333-3333-3333-333333333333/content"))
                .andExpect(jsonPath("$.category").doesNotExist())
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.steps[0].supportGuidance").doesNotExist());
    }

    @Test
    void anonymousMediaLoadsOnlyThroughShareScopedRoute() throws Exception {
        UUID mediaId = UUID.fromString("cccccccc-3333-3333-3333-333333333333");
        when(publicTaskShareService.loadSharedMedia("view-token", mediaId))
                .thenReturn(new TaskMediaStorageService.StoredTaskMediaContent(
                        new byte[]{7, 8, 9},
                        MediaType.IMAGE_PNG_VALUE,
                        "mani.png"
                ));

        mockMvc.perform(get("/api/public/shares/{token}/media/{mediaId}/content", "view-token", mediaId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andExpect(content().bytes(new byte[]{7, 8, 9}));
    }

    @Test
    void revokedOrInvalidTokensFailAcrossViewPresentAndMediaEndpoints() throws Exception {
        UUID mediaId = UUID.fromString("cccccccc-3333-3333-3333-333333333333");

        when(publicTaskShareService.getSharedTask("revoked"))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Shared task not found"));
        when(publicTaskShareService.getSharedPresent("revoked"))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Shared task not found"));
        when(publicTaskShareService.loadSharedMedia("revoked", mediaId))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Shared task not found"));

        mockMvc.perform(get("/api/public/shares/{token}", "revoked"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/public/shares/{token}/present", "revoked"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/public/shares/{token}/media/{mediaId}/content", "revoked", mediaId))
                .andExpect(status().isNotFound());
    }

    @Test
    void duplicateFromShareStaysAuthenticatedAndCreatesPrivateDraft() throws Exception {
        TaskBuilderPrincipal principal = new TaskBuilderPrincipal(
                UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                "teacher@example.com"
        );
        TaskCardResponse duplicated = new TaskCardResponse(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                "Routine mani",
                "Igiene",
                null,
                "Visivo",
                "Bagno",
                "private",
                "draft",
                3,
                principal.getEmail(),
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Instant.parse("2026-03-14T10:35:00Z")
        );

        when(publicTaskShareService.duplicateSharedTask("view-token", principal.getLocalUserId(), principal.getEmail()))
                .thenReturn(duplicated);

        mockMvc.perform(post("/api/public/shares/{token}/duplicate", "view-token"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/public/shares/{token}/duplicate", "view-token")
                        .with(authentication(authenticationToken(principal))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("dddddddd-dddd-dddd-dddd-dddddddddddd"))
                .andExpect(jsonPath("$.visibility").value("private"))
                .andExpect(jsonPath("$.status").value("draft"))
                .andExpect(jsonPath("$.authorName").value("teacher@example.com"));
    }

    private UsernamePasswordAuthenticationToken authenticationToken(TaskBuilderPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private PublicSharedTaskResponse sharedViewResponse(String token) {
        return new PublicSharedTaskResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Routine mani",
                "Igiene",
                "Sequenza pubblica salvata",
                3,
                Instant.parse("2026-03-14T10:30:00Z"),
                List.of(
                        new PublicSharedTaskResponse.SharedTaskStep(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri il rubinetto",
                                "Apri l acqua lentamente",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport("Apri", null, null)
                        ),
                        new PublicSharedTaskResponse.SharedTaskStep(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Prendi il sapone",
                                "Usa il dispenser",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "",
                                        new PublicSharedTaskResponse.SharedStepSymbol("symwriter", "soap", "Sapone"),
                                        null
                                )
                        ),
                        new PublicSharedTaskResponse.SharedTaskStep(
                                UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                3,
                                "Asciuga le mani",
                                "Usa l asciugamano",
                                false,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "",
                                        null,
                                        new PublicSharedTaskResponse.SharedStepImage(
                                                UUID.fromString("cccccccc-3333-3333-3333-333333333333"),
                                                "mani.png",
                                                MediaType.IMAGE_PNG_VALUE,
                                                2048,
                                                400,
                                                400,
                                                "Asciugamano",
                                                "/api/public/shares/" + token + "/media/cccccccc-3333-3333-3333-333333333333/content"
                                        )
                                )
                        )
                )
        );
    }

    private PublicSharedPresentResponse sharedPresentResponse(String token) {
        return new PublicSharedPresentResponse(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "Routine mani",
                3,
                List.of(
                        new PublicSharedPresentResponse.PresentStep(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri il rubinetto",
                                "Apri l acqua lentamente",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport("Apri", null, null)
                        ),
                        new PublicSharedPresentResponse.PresentStep(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Prendi il sapone",
                                "Usa il dispenser",
                                true,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "",
                                        new PublicSharedTaskResponse.SharedStepSymbol("symwriter", "soap", "Sapone"),
                                        null
                                )
                        ),
                        new PublicSharedPresentResponse.PresentStep(
                                UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                3,
                                "Asciuga le mani",
                                "Usa l asciugamano",
                                false,
                                new PublicSharedTaskResponse.SharedVisualSupport(
                                        "",
                                        null,
                                        new PublicSharedTaskResponse.SharedStepImage(
                                                UUID.fromString("cccccccc-3333-3333-3333-333333333333"),
                                                "mani.png",
                                                MediaType.IMAGE_PNG_VALUE,
                                                2048,
                                                400,
                                                400,
                                                "Asciugamano",
                                                "/api/public/shares/" + token + "/media/cccccccc-3333-3333-3333-333333333333/content"
                                        )
                                )
                        )
                )
        );
    }
}
