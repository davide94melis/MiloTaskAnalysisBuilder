# Phase 09 Research

## Goal

Plan Phase 9 so guided present mode can persist a minimal completion session record and authenticated users can inspect a basic usage history for their tasks, without pulling advanced clinical tracking, per-step analytics, or collaboration features forward from later product versions.

## Requirements In Scope

- `SESS-01`: When a task is completed in present mode, the app can save a minimal completion session record.
- `SESS-02`: A session record stores task ID, user or access context, completion date, step count, and completed status.
- `SESS-03`: Authenticated users can see at least a basic history or count of completed task sessions for their tasks.

## Boundaries To Preserve

Phase 9 sits on top of Phase 7 guided present mode and Phase 8 safe sharing. It should stay intentionally narrow:

- no per-step tracking, prompts used, timings, or clinical notes
- no analytics dashboard beyond a small history or count surface
- no child assignments, class linkage, or global Milo entities
- no write path from the editor; session persistence should happen only at present-mode completion
- no public history endpoints; history remains authenticated and owner-scoped
- no generic event stream or telemetry model

## Starting Point From Phases 7 And 8

The repo already has the playback and sharing surfaces where session tracking would start:

- authenticated guided present: `/tasks/:taskId/present`
- public guided present: `/shared/:token/present`
- public duplicate/import handoff through Milo login bridge
- no persisted session state yet; present-mode progress is entirely local in the browser
- no backend session table, repository, or controller
- no history UI on dashboard, library, editor, or present surfaces

This means Phase 9 is a true cross-stack phase:

- backend persistence and query APIs
- frontend completion write flow
- frontend authenticated history display
- careful handling of owner vs public-share access context

## Existing Reusable Building Blocks

### Frontend

- `frontend/src/app/features/present/task-guided-present-page.component.ts`
  - already knows exactly when a task transitions into the completed state
  - distinguishes owner-task and shared-task contexts
  - already has `taskId`, `shareToken`, step count, and local session completion state
- `frontend/src/app/core/tasks/task-library.service.ts`
  - central place for new session create/history methods
- dashboard and editor surfaces
  - either could host a minimal history surface, but dashboard is the safer first target because it already aggregates task-level operational info

### Backend

- authenticated owner task access through `TaskDetailService` and `TaskShellService`
- public-share resolution through `PublicTaskShareService`
- Milo-authenticated principal model already available on protected routes
- task/share domain already contains enough metadata to derive session ownership and access context

## Core Planning Decision: Keep Session Records Flat

The requirements only justify one persisted aggregate:

- `task_session`

Recommended fields:

- `id`
- `task_analysis_id`
- `owner_id`
- `share_id` nullable
- `access_mode` or `access_context`
- `completed_at`
- `step_count`
- `completed` boolean
- `created_at`

Possible `access_context` values:

- `owner_present`
- `shared_present`

Optional but still acceptable in Phase 9:

- `share_mode` separate from context if useful for reporting consistency
- `recipient_user_id` when authenticated duplication/import later matters, but not required now

Do not add:

- per-step child rows
- duration
- prompt count
- notes
- observer identity beyond the basic principal or share context needed for ownership

## Ownership And Access Context Rules

The session record should belong to the owner of the task being run, not to an arbitrary anonymous visitor.

Why:

- `SESS-03` says authenticated users can see history for their tasks
- the owner is the only stable user identity present for both authenticated owner present and anonymous shared present
- public share visitors may not be signed in, so history must still be attributable

Recommended rule set:

- authenticated `/tasks/:taskId/present` completion:
  - owner id from authenticated principal
  - `access_context = owner_present`
  - `share_id = null`
- public `/shared/:token/present` completion:
  - resolve active share token to share record
  - session belongs to the task owner from the share record
  - `access_context = shared_present`
  - `share_id = active share id`

This gives the owner a single history stream across both private and shared present runs without requiring public users to authenticate.

## Completion Trigger Guidance

The frontend already computes local completion when the last step is marked complete. Phase 9 should hook persistence exactly there.

Recommended behavior:

1. user completes the last step in guided present
2. UI enters completed state immediately
3. app attempts a single create-session write in the background
4. completion state stays local even if the write fails
5. UI surfaces a small non-blocking success/failure message for authenticated owner flows and shared flows

Important:

- avoid double-writing on revisit or refresh
- do not create a session on route entry or every step completion
- only create once per completed run

Frontend planning implication:

- add an idempotence guard in the component state, for example `sessionPersisted` or `sessionSaveState`
- reset that guard on `restartSession()` and route change

## API Surface Recommendation

Keep the backend contract small and explicit.

Recommended endpoints:

- `POST /api/tasks/{taskId}/sessions`
  - authenticated owner present-mode completion
- `POST /api/public/shares/{token}/sessions`
  - anonymous or authenticated public-present completion
- `GET /api/tasks/{taskId}/sessions`
  - authenticated owner history for one task
- `GET /api/tasks/dashboard`
  - optionally extended with a recent-session count summary if dashboard needs it

Alternative:

- `GET /api/sessions?taskId=...`

But task-scoped endpoints fit the existing domain better and keep authorization simple.

## Backend Service Design Recommendation

Use a dedicated service rather than hiding session writes inside present-mode controllers.

Suggested runtime pieces:

- `TaskSessionEntity`
- `TaskSessionRepository`
- `TaskSessionService`
- lightweight DTOs:
  - `CreateTaskSessionRequest`
  - `TaskSessionSummaryResponse`

Service responsibilities:

- validate owner access for authenticated task sessions
- resolve active share for public session writes
- compute owner id and share context safely
- persist one flat session record
- query recent history/counts for authenticated owners

Do not let public callers read history, and do not let public callers write sessions against revoked shares.

## Frontend Surface Recommendation

Phase 9 needs two minimal UI additions.

### 1. Present-mode completion persistence

Add a save-once write from the completed state in `task-guided-present-page.component.ts`.

The UI should:

- not block completion copy on network response
- show a brief confirmation like `Sessione registrata` when save succeeds
- show a brief warning when save fails
- avoid any complex retry UX in v1

### 2. Authenticated history display

The safest small UI is a compact history card on the task editor or dashboard.

Best v1 option:

- editor-side task history panel on `/tasks/:taskId`

Why:

- it answers `SESS-03` directly for the current task
- avoids inflating dashboard aggregation complexity
- uses an already-authenticated route with task context

Acceptable alternative:

- dashboard recent sessions summary if the planner wants broader visibility

If dashboard is chosen, keep it small:

- recent 5 sessions
- simple counts
- no charts

## Public Share Behavior In Phase 9

Public shared present should be able to create a minimal session record, but only through the share token.

Rules:

- only active `present` shares can create public sessions
- `view` shares should not create sessions
- revoked or invalid tokens fail with `404`
- anonymous completion is allowed because the share token anchors ownership

This preserves the Phase 8 public boundary while making public present usage countable for the owner.

## Likely Schema Migration

Recommended Flyway migration:

- `V8__create_task_session_tables.sql`

Suggested table:

- `taskbuilder.task_session`

Suggested indexes:

- `(task_analysis_id, completed_at desc)`
- `(owner_id, completed_at desc)`
- `(share_id, completed_at desc)` if `share_id` is stored

No join table is needed in Phase 9.

## Likely Plan Decomposition

Three plans in two or three waves should be enough.

### Wave 1

1. Backend session foundation
   - migration
   - entity/repository/service
   - authenticated and public session-create endpoints
   - history query endpoint

### Wave 2

2. Frontend present-mode persistence and task history surface
   - create-session calls from owner and shared present flows
   - save-state messaging
   - authenticated history display for a task

### Wave 3

3. Regression coverage, docs, and final verification
   - backend authorization and revocation tests
   - frontend entry/history tests
   - docs for session boundaries and deferred advanced tracking

## Verification Strategy

Phase 9 needs both backend and frontend proof because the highest-risk bugs are authorization and double-write behavior.

### Automated backend verification

- authenticated owner can create a session for an owned task
- non-owner cannot create or read sessions for another task
- public `present` share can create a session
- public `view` share cannot create a session
- revoked/invalid share cannot create a session
- history query returns only owner-visible sessions ordered by newest first

### Automated frontend verification

- owner present completion triggers one session write only once per completed run
- shared present completion uses the public share session endpoint instead of owner endpoint
- restart resets write guard so a second completed run can create a second session
- task history surface renders returned sessions or empty state cleanly

### Manual verification checklist

- complete an owner-present run and confirm one history record appears
- complete a shared-present run anonymously and confirm owner sees it in history
- restart and complete again to confirm a second record appears
- revoke a share and confirm further public completions do not persist
- confirm completion UI still works if the session write fails

### Verification commands

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`

## Validation Architecture

This phase has two high-risk dimensions that the plans should cover explicitly:

- access path:
  - authenticated owner present
  - anonymous shared present
  - revoked or invalid shared present
- persistence behavior:
  - create once on completion
  - no create on partial progress
  - no duplicate create on completed-step revisits
  - second create allowed after restart and second full completion

Minimum Nyquist matrix:

- `owner_present x success`
- `owner_present x write_failure`
- `shared_present x success`
- `shared_present x revoked`
- `shared_present x wrong_mode(view)`
- `history_read x owner`
- `history_read x non_owner_denied`

## What Must Stay Out Of Scope

- per-step child records
- elapsed time
- prompt/help levels
- clinical annotations
- charts and analytics
- school/team reporting
- filters beyond the minimal task-history use case
- export/report generation

## Planning Recommendation

Plan Phase 9 as a narrow session domain layered on top of the existing present and share boundaries:

- write exactly one flat session record per completed run
- attribute shared runs to the task owner through the share record
- expose only authenticated owner history
- keep the UI minimal and operational
- defer every richer clinical or analytical dimension to later phases
