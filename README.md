# Milo Task Analysis Builder

Milo Task Analysis Builder is a Milo ecosystem web app for creating and delivering visual task analyses. Phase 1 establishes only the Milo-backed authentication boundary; task authoring, sharing, tracking, and present mode arrive in later phases.

## Phase 1 Auth Contract

- This app does **not** implement a second credential system.
- Authentication comes from **Milo-issued JWTs**.
- The backend validates those JWTs using the shared `APP_JWT_SECRET` already used by Milo and sibling apps.
- The app stores its own local user record in the `taskbuilder` schema and links it to the Milo user UUID.
- The frontend restores authenticated state by calling `GET /api/auth/me`.

## Current Structure

- `backend/` - Spring Boot service that validates Milo JWTs, bootstraps local users, and exposes protected app APIs
- `frontend/` - Angular app with runtime config, Milo login bridge, auth guard, auth interceptor, and session restore flow
- `.planning/` - GSD planning artifacts, plans, research, and roadmap state

## Required Environment

### Backend

- `APP_JWT_SECRET` - must match the secret configured in Milo and other apps that trust Milo-issued JWTs
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

### Frontend

- `API_URL` - Task Builder backend base API URL including `/api`
- `MILO_API_URL` - Milo backend base API URL including `/api`

## Verification Entry Point

The frontend and later phases should treat `GET /api/auth/me` as the canonical way to confirm the current authenticated app session.

## Important V1 Scope Rule

Phase 1 only establishes SSO with Milo. The app does **not** yet reuse Milo Writer global entities such as children, classes, or other shared records.

## Phase 2 Dashboard And Library Contract

Phase 2 adds the first operational product surface on top of Phase 1 auth:

- authenticated dashboard at `/dashboard`
- card-based library at `/library`
- lightweight task-shell handoff route at `/tasks/:taskId`
- blank-task creation and template-start flow
- duplication and draft reopen behavior

### Backend API introduced in Phase 2

- `GET /api/tasks/dashboard`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/{taskId}`
- `POST /api/tasks/{taskId}/duplicate`
- `GET /api/templates`

### Phase 2 data boundary

Phase 2 persists only a lightweight task shell in `taskbuilder.task_analysis`:

- title
- category
- target label
- support level
- context label
- visibility
- status
- step count
- owner and timestamps
- duplication lineage

This is deliberate. Full metadata semantics and editor persistence are still deferred to Phase 3.

## Phase 3 Task Detail Contract

Phase 3 turns `/tasks/:taskId` into a real metadata editor and adds persisted ordered step drafts without pulling full step authoring forward from Phase 4.

### Backend API introduced in Phase 3

- `GET /api/tasks/{taskId}` now returns the task detail payload instead of a lightweight card
- `PUT /api/tasks/{taskId}` saves metadata plus the current ordered step draft array

### Task detail payload

The editor now round-trips:

- title
- category
- description
- educational objective
- professional notes
- context label
- target label
- support level
- difficulty level
- visibility
- ordered step drafts with `id`, `position`, `title`, and `description`

### Boundary with Phase 4

Phase 3 proves save/reload fidelity for metadata and step order only. Rich step authoring actions such as add, duplicate, delete, symbol/image/audio editing, and present-mode behavior still belong to later phases.

## Phase 4 Core Step Authoring Contract

Phase 4 turns `/tasks/:taskId` into a real non-media step authoring workflow.

### Backend and frontend contract added in Phase 4

- `taskbuilder.task_analysis_step` now persists:
  - `position`
  - `title`
  - `description`
  - `required`
  - `supportGuidance`
  - `reinforcementNotes`
  - `estimatedMinutes`
- `GET /api/tasks/{taskId}` returns the expanded step payload
- `PUT /api/tasks/{taskId}` round-trips the full step array using an explicit `1..n` position convention

### Editor behavior added in Phase 4

- add step
- edit title and description
- mark a step as required or optional
- define prompt/support guidance
- define reinforcement notes
- define estimated minutes
- move steps up and down
- duplicate and delete steps
- save and reload the whole authored sequence

### Boundary with Phase 5

Phase 4 intentionally stops at text and guidance authoring. Image upload, symbols, photo attachments, and mixed visual-support layouts still belong to Phase 5.

## Phase 5 Media Support Pipeline Contract

Phase 5 extends the existing task-detail aggregate instead of inventing separate step-media CRUD for saved composition.

### Backend API introduced in Phase 5

- `POST /api/tasks/{taskId}/media/uploads` accepts authenticated task-scoped image uploads
- `GET /api/tasks/{taskId}` now returns each step with a nested `visualSupport` object
- `PUT /api/tasks/{taskId}` still owns explicit persistence for the full ordered step array, including saved media references
- `GET /api/tasks/{taskId}/media/{mediaId}/content` serves authenticated image content for saved step media

### Frontend playback proof added in Phase 5 gap closure

- Authenticated users can open `/tasks/:taskId/preview` as a read-only playback proof outside the editor route.
- The preview fetches `GET /api/tasks/{taskId}` again and renders only the persisted `visualSupport` payload returned by the task-detail contract.
- Draft-only upload state in the editor is not the source of truth for preview rendering; users must save the task before preview includes newly uploaded media.
- This preview deliberately reuses the same authenticated media pipeline and saved media URLs already used by the editor. It does not introduce a separate save contract or public asset access path.

### Step visual support payload

Each saved step now round-trips this nested shape:

- `visualSupport.text`
- `visualSupport.symbol`
- `visualSupport.image`

`visualSupport.image` persists stable media metadata such as `mediaId`, `storageKey`, `fileName`, `mimeType`, `fileSizeBytes`, dimensions, and optional `altText`.

### Media reliability rules

- Uploaded binaries are handled only by the authenticated upload endpoint
- Saved step composition still persists only through explicit task save on `PUT /api/tasks/{taskId}`
- Stored step data keeps stable storage identifiers and metadata, not expiring signed URLs
- Read responses resolve a usable authenticated media URL at request time
- Task duplication copies visual text, symbol references, and saved media references so Phase 6 variants can build from stable authored content

### Boundary with later phases

- Phase 5 now includes only an authenticated read-only preview that proves saved media renders outside the editor
- Phase 5 does **not** implement Phase 7 guided present-mode flow, completion controls, or session behavior
- Phase 5 does **not** expose public or unauthenticated media access; that remains Phase 8 work
- Public asset rules, share-safe authorization, and any public media URLs stay deferred until sharing is designed explicitly

## Phase 6 Support Variants Contract

Phase 6 keeps variants deliberately narrow: they are duplication-based task families for different support levels, not version history, collaboration, or assignment workflows.

### Backend and frontend contract added in Phase 6

- `taskbuilder.task_analysis.variant_family_id` anchors each family on the original base task
- `POST /api/tasks` accepts `variantSourceTaskId` plus required `supportLevel` to create an explicit variant copy
- `GET /api/tasks` and `GET /api/tasks/{taskId}` now return family-aware metadata such as `variantRole`, root references, family counts, and related variants for navigation
- `POST /api/tasks/{taskId}/duplicate` remains the generic copy flow and does not implicitly join a family

### Variant-family behavior

- support level remains the primary visible differentiator across the library and editor
- base tasks and variants stay user-owned copies with explicit save boundaries
- variant creation reuses the existing Phase 5 step and media copy boundary, including saved symbol and image descriptors
- editor family navigation is informational and navigational only; it does not add diffing, approval, merge, or collaboration semantics

### Boundary with later phases

- Phase 6 does **not** implement Phase 7 guided present mode beyond the existing saved-preview proof
- Phase 6 does **not** implement Phase 8 sharing, public links, or public media access
- Phase 6 does **not** introduce version-control style history, conflict resolution, or multi-user ownership
