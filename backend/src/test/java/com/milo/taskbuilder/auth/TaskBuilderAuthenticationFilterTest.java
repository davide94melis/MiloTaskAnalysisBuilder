package com.milo.taskbuilder.auth;

import com.milo.taskbuilder.user.TaskBuilderUserService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskBuilderAuthenticationFilterTest {

    @Mock
    private MiloJwtService miloJwtService;

    @Mock
    private TaskBuilderUserService userService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesApiRequestWithValidBearerToken() throws ServletException, IOException {
        TaskBuilderAuthenticationFilter filter = new TaskBuilderAuthenticationFilter(miloJwtService, userService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        MiloJwtService.MiloJwtPayload payload = new MiloJwtService.MiloJwtPayload(UUID.randomUUID(), "teacher@example.com");
        TaskBuilderPrincipal principal = new TaskBuilderPrincipal(UUID.randomUUID(), payload.miloUserId(), payload.email());

        when(miloJwtService.parse("valid-token")).thenReturn(Optional.of(payload));
        when(userService.resolveOrCreate(payload)).thenReturn(principal);

        filter.doFilter(request, response, chain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertSame(principal, authentication.getPrincipal());
        verify(userService).resolveOrCreate(payload);
    }

    @Test
    void leavesSecurityContextEmptyForInvalidToken() throws ServletException, IOException {
        TaskBuilderAuthenticationFilter filter = new TaskBuilderAuthenticationFilter(miloJwtService, userService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer invalid-token");

        when(miloJwtService.parse("invalid-token")).thenReturn(Optional.empty());

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userService);
    }

    @Test
    void skipsNonApiPaths() throws ServletException, IOException {
        TaskBuilderAuthenticationFilter filter = new TaskBuilderAuthenticationFilter(miloJwtService, userService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(miloJwtService, userService);
    }
}
