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
      and (:category::text is null or lower(task.category) = lower(:category::text))
      and (:contextLabel::text is null or lower(task.context_label) = lower(:contextLabel::text))
      and (:targetLabel::text is null or lower(task.target_label) = lower(:targetLabel::text))
      and (:author::text is null or lower(task.author_name) like lower(concat('%', :author::text, '%')))
      and (:status::text is null or task.status = :status::text)
      and (:supportLevel::text is null or lower(task.support_level) = lower(:supportLevel::text))
      and (
          :search::text is null
          or lower(task.title) like lower(concat('%', :search::text, '%'))
          or lower(coalesce(task.category, '')) like lower(concat('%', :search::text, '%'))
          or lower(coalesce(task.target_label, '')) like lower(concat('%', :search::text, '%'))
          or lower(coalesce(task.context_label, '')) like lower(concat('%', :search::text, '%'))
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
