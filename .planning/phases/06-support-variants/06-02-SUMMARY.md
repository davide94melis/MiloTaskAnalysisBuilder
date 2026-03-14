---
phase: 06-support-variants
plan: 02
subsystem: api
tags: [variants, duplication, spring, controller, validation]
requires:
  - phase: 06-support-variants
    provides: variant family metadata on task cards and task detail responses
provides:
  - explicit create-variant request handling on the task creation API
  - family-aware variant duplication built on the existing task copy primitives
  - backend coverage for support-level validation and unchanged generic duplicate behavior
affects: [support-variants, library, task-editor]
tech-stack:
  added: []
  patterns: [copy-based variant creation, family-root resolution, controller-level request intent branching]
key-files:
  created: [.planning/phases/06-support-variants/06-02-SUMMARY.md]
  modified:
    - backend/src/main/java/com/milo/taskbuilder/library/dto/CreateTaskRequest.java
    - backend/src/main/java/com/milo/taskbuilder/library/TaskLibraryController.java
    - backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java
    - backend/src/test/java/com/milo/taskbuilder/task/TaskShellServiceTest.java
    - backend/src/test/java/com/milo/taskbuilder/library/TaskLibraryControllerIntegrationTest.java
key-decisions:
  - "Variant creation reuses the existing duplication boundary and only overrides family linkage plus support level."
  - "The active create-variant HTTP entry point is TaskLibraryController because the plan's TaskShellController path does not exist in this repo."
patterns-established:
  - "Variant flow: POST /api/tasks with variantSourceTaskId + supportLevel creates a family-aware copy."
  - "Generic duplicate remains POST /api/tasks/{taskId}/duplicate with no variant-family side effects."
requirements-completed: [SUPP-01, SUPP-02]
duration: 10 min
completed: 2026-03-14
---

# Phase 6 Plan 02: Variant Creation Flow Summary

**Family-aware variant creation now rides the existing copy pipeline, requiring support level input while preserving Phase 5 step and media duplication unchanged.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-14T01:25:00Z
- **Completed:** 2026-03-14T01:35:09Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added an explicit create-variant request shape so clients can distinguish new draft, template copy, and family-aware variant intents.
- Implemented `createVariant(...)` by reusing the proven duplication primitives and resolving the family root from either the source task or its existing root anchor.
- Locked the controller contract with integration coverage for support-level validation, variant metadata in responses, and unchanged generic duplicate behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add a distinct create-variant request path** - `8a4fdfe` (feat)
2. **Task 2: Implement family-aware create-variant behavior in the service layer** - `0ae0a96` (feat)
3. **Task 3: Lock the create-variant contract with controller tests** - `9100ad1` (test)

## Files Created/Modified
- `.planning/phases/06-support-variants/06-02-SUMMARY.md` - plan execution summary and deviation record
- `backend/src/main/java/com/milo/taskbuilder/library/dto/CreateTaskRequest.java` - explicit variant intent fields plus helper detection
- `backend/src/main/java/com/milo/taskbuilder/library/TaskLibraryController.java` - request branching and support-level validation for variant creation
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java` - family-root-aware variant duplication built on the existing copy boundary
- `backend/src/test/java/com/milo/taskbuilder/task/TaskShellServiceTest.java` - first-generation, second-generation, and validation coverage for variant creation
- `backend/src/test/java/com/milo/taskbuilder/library/TaskLibraryControllerIntegrationTest.java` - HTTP contract coverage for create-variant and duplicate endpoints
- `.planning/STATE.md` - advanced plan/session context and recorded variant-flow decisions
- `.planning/ROADMAP.md` - updated Phase 6 progress note to point to 06-03 next

## Decisions Made
- Used the existing `POST /api/tasks` endpoint for create-variant requests instead of inventing a second task-creation endpoint.
- Required non-blank `supportLevel` at both controller and service layers so the variant contract cannot drift into unlabeled family members.
- Kept generic duplicate untouched as a separate intent and reused the exact Phase 5 step/media copy boundary for variants.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan controller paths did not match the live codebase**
- **Found during:** Task 1 (Add a distinct create-variant request path)
- **Issue:** The plan referenced `TaskShellController` and `TaskShellControllerIntegrationTest`, but the active API entry point and matching integration test live under the library package.
- **Fix:** Implemented the controller changes in `TaskLibraryController` and `TaskLibraryControllerIntegrationTest`, which are the real runtime paths for `/api/tasks`.
- **Files modified:** `backend/src/main/java/com/milo/taskbuilder/library/TaskLibraryController.java`, `backend/src/test/java/com/milo/taskbuilder/library/TaskLibraryControllerIntegrationTest.java`
- **Verification:** Focused backend tests and full `mvn test` both passed.
- **Committed in:** `8a4fdfe`, `9100ad1`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep. The implementation follows the planned behavior through the repo's actual controller layout.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Create-variant backend foundations are complete and verified.
- Ready for `06-03` to consume the explicit variant contract in library-facing UI and client services.

---
*Phase: 06-support-variants*
*Completed: 2026-03-14*
