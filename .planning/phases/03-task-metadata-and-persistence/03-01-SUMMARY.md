---
requirements-completed:
  - META-01
  - META-02
  - META-03
  - META-04
  - STEP-08
---

# Phase 03 Plan 03-01 Summary

## Outcome

Extended the Phase 2 task aggregate into a Phase 3 task detail contract with durable metadata persistence and ordered step drafts on the same backend record. The backend now stores task description/objective/notes/difficulty, exposes authenticated detail read and write endpoints, and preserves submitted step order exactly on reload without changing the Phase 2 dashboard or library card/list payloads.

Template duplication now carries forward the richer metadata and any persisted step drafts, so Phase 3 detail state survives both reload and copy flows.

## Changed Files

- `backend/src/main/resources/db/migration/V3__extend_task_analysis_metadata.sql`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellEntity.java`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskAnalysisStepEntity.java`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskAnalysisStepRepository.java`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskDetailMapper.java`
- `backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java`
- `backend/src/main/java/com/milo/taskbuilder/task/dto/TaskDetailResponse.java`
- `backend/src/main/java/com/milo/taskbuilder/task/dto/UpdateTaskRequest.java`
- `backend/src/main/java/com/milo/taskbuilder/library/TaskLibraryController.java`
- `backend/src/test/java/com/milo/taskbuilder/task/TaskDetailControllerIntegrationTest.java`
- `backend/src/test/java/com/milo/taskbuilder/task/TaskDetailServiceTest.java`

## Verification

- Ran `mvn test` in `backend/`
- Result: passed
- Added task-package coverage for authenticated detail fetch/update routes, metadata persistence mapping, and authoritative step-order save/reload behavior

## Notes

- Phase 2 card/list/dashboard contracts remain unchanged; the detail payload is isolated in `TaskDetailResponse`.
- `GET /api/tasks/{taskId}` now serves the full detail payload directly, and `PUT /api/tasks/{taskId}` persists metadata plus ordered step drafts for authenticated owners.
- Ordered step drafts are stored in `taskbuilder.task_analysis_step` with explicit `position`, keeping Phase 3 persistence minimal and Phase 4-ready without introducing full authoring operations yet.

