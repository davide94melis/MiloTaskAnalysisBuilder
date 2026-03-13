# Backend Deploy Notes

## Purpose

This backend joins the Milo shared-auth ecosystem. It validates Milo-issued JWTs and maps them into app-local users stored in the `taskbuilder` schema.

## Required Environment Variables

- `APP_JWT_SECRET`
  - Must be identical to the value used by Milo and sibling apps that trust Milo JWTs.
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## Auth Behavior

- Bearer tokens on `/api/**` are treated as Milo JWT candidates.
- Valid Milo JWTs are parsed by `MiloJwtService`.
- The backend resolves or creates a local app user from the Milo user UUID and email.
- `GET /api/auth/me` is the protected bootstrap endpoint for frontend session restore.

## Phase 2 API Contract

Phase 2 adds the authenticated dashboard and library API:

- `GET /api/tasks/dashboard` - recent drafts, seed templates, and simple counters
- `GET /api/tasks` - library cards plus available filter values
- `POST /api/tasks` - create a blank draft or create from `templateId`
- `GET /api/tasks/{taskId}` - reopen an owned draft by id
- `POST /api/tasks/{taskId}/duplicate` - copy an accessible draft or template into a new user-owned draft
- `GET /api/templates` - seed template cards

The persisted Phase 2 model is intentionally a lightweight task shell in `taskbuilder.task_analysis`. Do not treat it as the full Phase 3 editor schema.

## Phase 3 API Contract

Phase 3 expands the backend into a real task detail persistence boundary:

- `GET /api/tasks/{taskId}` returns the authenticated owner's full task detail payload
- `PUT /api/tasks/{taskId}` saves metadata and the ordered step draft array

The persisted model now spans:

- `taskbuilder.task_analysis` for task-level metadata
- `taskbuilder.task_analysis_step` for ordered step drafts

`environmentLabel` is currently backed by the existing `context_label` field so Phase 4 can extend authoring without another schema rewrite.

## Phase 4 API Contract

Phase 4 expands the step payload on the existing task-detail aggregate instead of introducing separate step endpoints.

- `GET /api/tasks/{taskId}` returns expanded step records with:
  - `id`
  - `position`
  - `title`
  - `description`
  - `required`
  - `supportGuidance`
  - `reinforcementNotes`
  - `estimatedMinutes`
- `PUT /api/tasks/{taskId}` accepts the same nested step shape and persists it using the explicit `1..n` ordering convention

The `taskbuilder.task_analysis_step` table now stores the non-media authoring fields needed for Phase 4. Media-related fields are still deferred.

## Deployment Checklist

1. Provision the Postgres/Supabase database with the `taskbuilder` schema available.
2. Set `APP_JWT_SECRET` to the same shared secret already used by Milo.
3. Set datasource environment variables.
4. Start the backend and confirm `mvn -q -DskipTests compile` or the CI build is green.
5. Verify `GET /api/auth/me` returns `401` without a bearer token.
6. Verify `GET /api/auth/me` returns the current user payload with a valid Milo JWT.

## Scope Reminder

This backend does not implement local login, registration, or shared Milo entities. Phase 4 adds full non-media step authoring on the existing aggregate, but still does not include symbol/image/media workflows.
