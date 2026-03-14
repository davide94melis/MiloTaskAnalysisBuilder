---
phase: 06-support-variants
plan: 01
subsystem: api
tags: [variants, lineage, library, spring, flyway]
requires:
  - phase: 05-media-support-pipeline
    provides: media-preserving duplication boundaries for task shells and steps
provides:
  - stable variant family lineage on task shells
  - family-aware library card metadata for root, variant, and standalone tasks
  - forward-compatible task detail contract fields for later family navigation work
affects: [support-variants, library, task-detail]
tech-stack:
  added: []
  patterns: [copy-based variant families anchored by task ids, family metadata derived in the service layer]
key-files:
  created: [backend/src/main/resources/db/migration/V6__add_task_variant_family.sql]
  modified:
    - backend/src/main/java/com/milo/taskbuilder/task/TaskShellEntity.java
    - backend/src/main/java/com/milo/taskbuilder/task/TaskShellRepository.java
    - backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java
    - backend/src/main/java/com/milo/taskbuilder/task/TaskShellMapper.java
    - backend/src/main/java/com/milo/taskbuilder/library/dto/TaskCardResponse.java
    - backend/src/main/java/com/milo/taskbuilder/task/dto/TaskDetailResponse.java
    - backend/src/test/java/com/milo/taskbuilder/task/TaskShellServiceTest.java
key-decisions:
  - "Variant families use a nullable task-level anchor separate from immediate source_task_id lineage."
  - "Library family metadata is derived from existing task shells instead of introducing a variant table or version engine."
  - "Generic duplicate stays unchanged and does not assign variant-family metadata until the dedicated create-variant flow lands."
patterns-established:
  - "Variant cards expose variantRole plus root/count metadata so the frontend can group families without reconstructing lineage."
requirements-completed: [SUPP-01, SUPP-03]
duration: 10 min
completed: 2026-03-14
---

# Phase 06 Plan 01: Backend Variant Family Foundation Summary

**Stable task-family anchors plus family-aware library card metadata for support-level variants without introducing a versioning subsystem**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-14T01:14:00Z
- **Completed:** 2026-03-14T01:23:35Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Added a Flyway migration and entity field for nullable `variant_family_id`, keeping `source_task_id` as immediate duplication lineage.
- Extended task card contracts and service mapping so library consumers can distinguish standalone tasks, family roots, and variants.
- Added service tests proving family-aware library metadata and that generic duplicate behavior still stays outside variant-family semantics.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add variant-family schema support to task shells** - `983cfba` (feat)
2. **Task 2: Extend card/detail contracts with family-aware metadata** - `88444d5` (feat)
3. **Task 3: Add repository/query support for family-aware library rendering** - `88444d5` (feat)

## Files Created/Modified
- `backend/src/main/resources/db/migration/V6__add_task_variant_family.sql` - Adds the stable family anchor column and supporting indexes.
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellEntity.java` - Exposes `variantFamilyId` on the persisted task shell model.
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellRepository.java` - Adds bulk lookup methods needed to derive family summaries.
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java` - Computes root, variant, and standalone metadata for library-facing cards.
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellMapper.java` - Maps family metadata onto card DTOs with a standalone default.
- `backend/src/main/java/com/milo/taskbuilder/library/dto/TaskCardResponse.java` - Adds root/count/role fields while preserving the existing constructor shape.
- `backend/src/main/java/com/milo/taskbuilder/task/dto/TaskDetailResponse.java` - Adds forward-compatible family fields and related-variant scaffolding with a compatibility constructor.
- `backend/src/test/java/com/milo/taskbuilder/task/TaskShellServiceTest.java` - Covers mixed standalone/root/variant cards and duplicate preservation.

## Decisions Made
- Used `variant_family_id` as a lightweight family anchor so sibling grouping survives duplicate-from-variant chains later without changing current duplication semantics.
- Kept the family summary derivation in `TaskShellService` so library queries remain simple and ownership rules stay unchanged.
- Preserved support level as the visible differentiator and avoided any separate variant label or collaboration model.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Kept the task detail contract additive to preserve existing detail mapper callers**
- **Found during:** Task 2 (Extend card/detail contracts with family-aware metadata)
- **Issue:** The owned-file boundary excluded `TaskDetailMapper` and `TaskDetailService`, so changing the detail record shape risked breaking existing callers immediately.
- **Fix:** Added compatibility constructors on `TaskDetailResponse` and staged the family fields for later runtime population while fully wiring the card-facing metadata in this plan.
- **Files modified:** `backend/src/main/java/com/milo/taskbuilder/task/dto/TaskDetailResponse.java`
- **Verification:** `mvn test`
- **Committed in:** `88444d5`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Library-facing family metadata is fully available. Detail-family fields are present in the contract but still need mapper/service population in a later scoped change.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 6 now has the lineage and card-contract base needed for a dedicated create-variant flow.
- Next plan `06-02` can set `variant_family_id` during variant creation while preserving Phase 5 media duplication boundaries.

---
*Phase: 06-support-variants*
*Completed: 2026-03-14*
