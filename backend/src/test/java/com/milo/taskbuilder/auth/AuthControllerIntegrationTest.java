package com.milo.taskbuilder.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MiloJwtService miloJwtService;

    @MockitoBean
    private com.milo.taskbuilder.user.TaskBuilderUserService taskBuilderUserService;

    @Test
    void returnsUnauthorizedWhenAuthenticationMissing() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void returnsCurrentAuthenticatedUser() throws Exception {
        TaskBuilderPrincipal principal = new TaskBuilderPrincipal(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "teacher@example.com"
        );

        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        mockMvc.perform(get("/api/auth/me").principal(authenticationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(principal.getLocalUserId().toString()))
                .andExpect(jsonPath("$.miloUserId").value(principal.getMiloUserId().toString()))
                .andExpect(jsonPath("$.email").value(principal.getEmail()));
    }
}
