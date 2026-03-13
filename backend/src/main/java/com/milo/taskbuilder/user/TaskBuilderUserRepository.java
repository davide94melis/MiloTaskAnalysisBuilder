package com.milo.taskbuilder.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaskBuilderUserRepository extends JpaRepository<TaskBuilderUserEntity, UUID> {

    Optional<TaskBuilderUserEntity> findByMiloUserId(UUID miloUserId);

    Optional<TaskBuilderUserEntity> findByEmail(String email);
}
