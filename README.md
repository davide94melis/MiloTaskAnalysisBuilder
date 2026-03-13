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
