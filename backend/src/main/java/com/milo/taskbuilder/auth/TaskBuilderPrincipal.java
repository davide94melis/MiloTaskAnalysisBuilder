package com.milo.taskbuilder.auth;

import java.security.Principal;
import java.util.UUID;

public class TaskBuilderPrincipal implements Principal {

    private final UUID localUserId;
    private final UUID miloUserId;
    private final String email;

    public TaskBuilderPrincipal(UUID localUserId, UUID miloUserId, String email) {
        this.localUserId = localUserId;
        this.miloUserId = miloUserId;
        this.email = email;
    }

    public UUID getLocalUserId() {
        return localUserId;
    }

    public UUID getMiloUserId() {
        return miloUserId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String getName() {
        return email != null ? email : localUserId.toString();
    }
}
