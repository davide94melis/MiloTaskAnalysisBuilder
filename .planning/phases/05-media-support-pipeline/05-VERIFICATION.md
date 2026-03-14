## GAPS FOUND

status: gaps_found

## Result

Verified on 2026-03-14.

Phase 05 materially delivers the editor-side media pipeline: the backend persists nested step visual support data, image upload is handled through a dedicated authenticated endpoint, the editor supports text/symbol/photo combinations, and duplication preserves saved media metadata. However, the phase goal and `MEDI-02` claim reliable media in both editing and playback contexts, and the current repo still does not implement any present-mode or playback surface. The implementation establishes a future-facing contract for playback, but not an actual playback context.

## Requirement Coverage

- `STEP-03`: Pass. `TaskDetailService` enforces at least one visual support per saved step and persists text/symbol/image support on the task aggregate (`backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java:117`).
- `STEP-04`: Pass. The DTO/service/editor flow supports mixed combinations such as symbol + text and photo + text in one step (`backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java:121`, `frontend/src/app/features/library/task-step-authoring-editor.component.ts:137`).
- `MEDI-01`: Pass. Authenticated task-scoped upload exists in the backend and is consumed by the editor service/UI (`backend/src/main/java/com/milo/taskbuilder/task/TaskMediaController.java:31`, `frontend/src/app/core/tasks/task-library.service.ts:59`, `frontend/src/app/features/library/task-step-authoring-editor.component.ts:618`).
- `MEDI-02`: Gap. The backend returns authenticated content URLs and the editor reload path preserves them (`backend/src/main/java/com/milo/taskbuilder/task/TaskMediaController.java:46`, `frontend/src/app/features/library/task-shell-editor-entry.component.ts:385`), but there is no present-mode/playback implementation or route in the repo to prove reliable media delivery in playback contexts (`frontend/src/app/app.routes.ts:9`).

## Evidence

- The existing `GET /api/tasks/{id}` / `PUT /api/tasks/{id}` aggregate remains the source of truth for saved visual support, with validation for required visual support and step-media reassociation during saves (`backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java:47`).
- Binary upload is split onto `POST /api/tasks/{taskId}/media/uploads`, and saved media is served through authenticated content URLs rather than persisted signed URLs (`backend/src/main/java/com/milo/taskbuilder/task/TaskMediaController.java:31`).
- The step editor exposes visual text, symbol selection, image upload, preview, alt text, and per-step upload state without leaving `/tasks/:taskId` (`frontend/src/app/features/library/task-step-authoring-editor.component.ts:127`).
- The route container preserves explicit save semantics and round-trips nested `visualSupport` payloads while keeping upload state local to the draft (`frontend/src/app/features/library/task-shell-editor-entry.component.ts:327`).
- Task duplication copies visual text, symbol metadata, and media metadata rows so saved authored content survives copy flows (`backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java:162`).
- There is still no present-mode/playback route or component in the frontend router; only dashboard, library, and task editor routes exist (`frontend/src/app/app.routes.ts:24`).

## Must-Have Audit

- Pass: The existing task detail aggregate is still the persisted boundary for saved visual support.
- Pass: Binary upload uses a dedicated authenticated endpoint instead of task-detail `PUT`.
- Pass: Saved image metadata uses stable identifiers and storage keys, not raw bytes or persisted signed URLs.
- Partial only: The backend can return mixed visual support data for future playback reuse, but playback itself is not present in this repo.

## Commands / Method

- Reviewed required planning artifacts, summaries, requirements, roadmap, implementation files, and test files.
- Did not rerun `mvn test`, `npm test`, or `npm run build` during this verification turn.

## Conclusion

Phase 05 is substantially complete for editor authoring and save/reload reliability, but it does not fully achieve the stated phase goal as written. The repo proves editor reliability and establishes a playback-ready contract; it does not prove reliable media in an implemented playback context. Phase status should remain `gaps_found` until either:

- the phase goal / `MEDI-02` wording is narrowed to editor + future playback contract readiness, or
- playback consumption is actually implemented and verified.
