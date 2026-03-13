package com.milo.taskbuilder.auth;

import java.util.UUID;

public class AuthMeResponse {

    private UUID id;
    private UUID miloUserId;
    private String email;

    public static AuthMeResponse from(TaskBuilderPrincipal principal) {
        AuthMeResponse response = new AuthMeResponse();
        response.setId(principal.getLocalUserId());
        response.setMiloUserId(principal.getMiloUserId());
        response.setEmail(principal.getEmail());
        return response;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMiloUserId() {
        return miloUserId;
    }

    public void setMiloUserId(UUID miloUserId) {
        this.miloUserId = miloUserId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
