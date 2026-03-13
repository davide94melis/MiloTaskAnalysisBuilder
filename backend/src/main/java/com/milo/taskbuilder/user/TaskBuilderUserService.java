package com.milo.taskbuilder.user;

import com.milo.taskbuilder.auth.MiloJwtService;
import com.milo.taskbuilder.auth.TaskBuilderPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskBuilderUserService {

    private final TaskBuilderUserRepository repository;

    public TaskBuilderUserService(TaskBuilderUserRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TaskBuilderPrincipal resolveOrCreate(MiloJwtService.MiloJwtPayload payload) {
        String normalizedEmail = normalizeEmail(payload.email());

        TaskBuilderUserEntity entity = repository.findByMiloUserId(payload.miloUserId())
                .orElseGet(() -> repository.findByEmail(normalizedEmail).orElseGet(TaskBuilderUserEntity::new));

        entity.setMiloUserId(payload.miloUserId());
        entity.setEmail(normalizedEmail);

        TaskBuilderUserEntity saved = repository.save(entity);
        return new TaskBuilderPrincipal(saved.getId(), saved.getMiloUserId(), saved.getEmail());
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Milo JWT must include a non-empty email");
        }
        return email.trim().toLowerCase();
    }
}
