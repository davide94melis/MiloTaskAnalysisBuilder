package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskShellRepository extends JpaRepository<TaskShellEntity, UUID> {

    @Query("""
            select task
            from TaskShellEntity task
            where (task.ownerId = :ownerId or task.status = com.milo.taskbuilder.task.TaskShellStatus.TEMPLATE)
              and (:category is null or lower(task.category) = lower(:category))
              and (:contextLabel is null or lower(task.contextLabel) = lower(:contextLabel))
              and (:targetLabel is null or lower(task.targetLabel) = lower(:targetLabel))
              and (:author is null or lower(task.authorName) like lower(concat('%', :author, '%')))
              and (:status is null or task.status = :status)
              and (:supportLevel is null or lower(task.supportLevel) = lower(:supportLevel))
              and (
                  :search is null
                  or lower(task.title) like lower(concat('%', :search, '%'))
                  or lower(coalesce(task.category, '')) like lower(concat('%', :search, '%'))
                  or lower(coalesce(task.targetLabel, '')) like lower(concat('%', :search, '%'))
                  or lower(coalesce(task.contextLabel, '')) like lower(concat('%', :search, '%'))
              )
            order by task.updatedAt desc
            """)
    List<TaskShellEntity> findLibraryCards(
            @Param("ownerId") UUID ownerId,
            @Param("category") String category,
            @Param("contextLabel") String contextLabel,
            @Param("targetLabel") String targetLabel,
            @Param("author") String author,
            @Param("status") TaskShellStatus status,
            @Param("supportLevel") String supportLevel,
            @Param("search") String search
    );

    @Query("""
            select task
            from TaskShellEntity task
            where task.ownerId = :ownerId
              and task.status = com.milo.taskbuilder.task.TaskShellStatus.DRAFT
            order by task.updatedAt desc
            """)
    List<TaskShellEntity> findRecentDrafts(@Param("ownerId") UUID ownerId);

    @Query("""
            select task
            from TaskShellEntity task
            where task.status = com.milo.taskbuilder.task.TaskShellStatus.TEMPLATE
            order by task.updatedAt desc
            """)
    List<TaskShellEntity> findTemplates();

    Optional<TaskShellEntity> findByIdAndOwnerId(UUID id, UUID ownerId);

    long countByOwnerIdAndStatus(UUID ownerId, TaskShellStatus status);

    long countByStatus(TaskShellStatus status);

    @Query("""
            select task
            from TaskShellEntity task
            where task.id = :id
              and (task.ownerId = :ownerId or task.status = com.milo.taskbuilder.task.TaskShellStatus.TEMPLATE)
            """)
    Optional<TaskShellEntity> findAccessibleById(@Param("id") UUID id, @Param("ownerId") UUID ownerId);
}
