package com.milo.taskbuilder.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof TaskBuilderPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(AuthMeResponse.from(principal));
    }
}
