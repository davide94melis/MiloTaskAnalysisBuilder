package com.milo.taskbuilder.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskShellRepository extends JpaRepository<TaskShellEntity, UUID> {

    @Query(value = """
        select *
        from taskbuilder.task_analysis task
        where (task.owner_id = :ownerId or task.status = 'template')
          and (:category is null or lower(task.category) = lower(cast(:category as text)))
          and (:contextLabel is null or lower(task.context_label) = lower(cast(:contextLabel as text)))
          and (:targetLabel is null or lower(task.target_label) = lower(cast(:targetLabel as text)))
          and (:author is null or lower(task.author_name) like lower(concat('%', cast(:author as text), '%')))
          and (cast(:status as text) is null or task.status = cast(:status as text))
          and (:supportLevel is null or lower(task.support_level) = lower(cast(:supportLevel as text)))
          and (
              :search is null
              or lower(task.title) like lower(concat('%', cast(:search as text), '%'))
              or lower(coalesce(task.category, '')) like lower(concat('%', cast(:search as text), '%'))
              or lower(coalesce(task.target_label, '')) like lower(concat('%', cast(:search as text), '%'))
              or lower(coalesce(task.context_label, '')) like lower(concat('%', cast(:search as text), '%'))
          )
        order by task.updated_at desc
        """, nativeQuery = true)
    List<TaskShellEntity> findLibraryCards(
            @Param("ownerId") UUID ownerId,
            @Param("category") String category,
            @Param("contextLabel") String contextLabel,
            @Param("targetLabel") String targetLabel,
            @Param("author") String author,
            @Param("status") String status,   // ← diventa String, non più TaskShellStatus
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

    List<TaskShellEntity> findByIdIn(List<UUID> ids);

    List<TaskShellEntity> findByVariantFamilyIdIn(List<UUID> variantFamilyIds);

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
