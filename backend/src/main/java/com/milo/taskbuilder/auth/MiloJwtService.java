package com.milo.taskbuilder.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

@Service
public class MiloJwtService {

    private static final Logger log = LoggerFactory.getLogger(MiloJwtService.class);

    private final SecretKey key;

    public record MiloJwtPayload(UUID miloUserId, String email) {
    }

    public MiloJwtService(MiloJwtProperties properties) {
        if (!properties.isConfigured()) {
            this.key = null;
            return;
        }
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public boolean isEnabled() {
        return key != null;
    }

    public Optional<MiloJwtPayload> parse(String token) {
        if (!isEnabled() || token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String subject = claims.getSubject();
            if (subject == null || subject.isBlank()) {
                return Optional.empty();
            }

            UUID miloUserId = UUID.fromString(subject);
            String email = claims.get("email", String.class);
            return Optional.of(new MiloJwtPayload(miloUserId, email));
        } catch (Exception ex) {
            log.debug("Failed to parse Milo JWT", ex);
            return Optional.empty();
        }
    }
}
