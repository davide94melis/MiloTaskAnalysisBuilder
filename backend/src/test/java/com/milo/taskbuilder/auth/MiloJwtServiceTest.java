package com.milo.taskbuilder.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MiloJwtServiceTest {

    private static final String SECRET = "0123456789012345678901234567890123456789";

    @Test
    void parsesValidMiloJwt() {
        MiloJwtService service = new MiloJwtService(propertiesWithSecret(SECRET));
        UUID miloUserId = UUID.randomUUID();
        String token = Jwts.builder()
                .subject(miloUserId.toString())
                .claim("email", "Teacher@example.com")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        Optional<MiloJwtService.MiloJwtPayload> parsed = service.parse(token);

        assertTrue(parsed.isPresent());
        assertEquals(miloUserId, parsed.get().miloUserId());
        assertEquals("Teacher@example.com", parsed.get().email());
    }

    @Test
    void returnsEmptyForInvalidToken() {
        MiloJwtService service = new MiloJwtService(propertiesWithSecret(SECRET));

        assertTrue(service.parse("not-a-jwt").isEmpty());
    }

    @Test
    void returnsEmptyWhenSecretIsNotConfigured() {
        MiloJwtService service = new MiloJwtService(new MiloJwtProperties());

        assertFalse(service.isEnabled());
        assertTrue(service.parse("anything").isEmpty());
    }

    @Test
    void returnsEmptyWhenSubjectMissing() {
        MiloJwtService service = new MiloJwtService(propertiesWithSecret(SECRET));
        String token = Jwts.builder()
                .claim("email", "teacher@example.com")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertTrue(service.parse(token).isEmpty());
    }

    private MiloJwtProperties propertiesWithSecret(String secret) {
        MiloJwtProperties properties = new MiloJwtProperties();
        properties.setSecret(secret);
        return properties;
    }
}
