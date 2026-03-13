package com.milo.taskbuilder.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "milo.jwt")
public class MiloJwtProperties {

    private String secret;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public boolean isConfigured() {
        return secret != null && !secret.isBlank();
    }
}
