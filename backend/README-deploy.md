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

## Phase 5 API Contract

Phase 5 keeps media persistence inside the authenticated task aggregate while splitting binary upload onto a dedicated endpoint.

- `POST /api/tasks/{taskId}/media/uploads` accepts authenticated multipart image upload and returns the saved media descriptor needed by the editor draft
- `GET /api/tasks/{taskId}` returns each ordered step with `visualSupport.text`, `visualSupport.symbol`, and `visualSupport.image`
- `PUT /api/tasks/{taskId}` persists the full ordered step array, including text, symbol references, and uploaded image references
- `GET /api/tasks/{taskId}/media/{mediaId}/content` resolves authenticated media bytes for saved image descriptors

Saved image descriptors must persist stable identifiers such as `mediaId` and `storageKey`. Do not treat returned content URLs as durable storage values.

Phase 5 duplication behavior copies:

- visual text
- symbol library/key/label references
- saved media metadata rows pointing at the same storage object

This is the intended v1 boundary. Physical object cloning, public asset exposure, and share-safe media authorization remain Phase 8 concerns.

## Phase 6 API Contract

Phase 6 adds duplication-based support variants without changing the Phase 5 media boundary.

- `POST /api/tasks` now accepts `variantSourceTaskId` with required `supportLevel` to create a new family member from an accessible saved task
- `GET /api/tasks` card payloads expose `variantFamilyId`, `variantRootTaskId`, `variantRootTitle`, `variantRole`, and `variantCount`
- `GET /api/tasks/{taskId}` detail payloads expose the same family metadata plus `relatedVariants` for editor-side navigation
- `POST /api/tasks/{taskId}/duplicate` stays generic and does not set family metadata

Variant creation must continue to:

- copy ordered steps exactly as the generic duplicate flow does
- reuse saved step media metadata and storage keys instead of cloning image objects
- preserve support-level labeling as the primary variant distinguisher

Do not treat Phase 6 as a versioning system. Present-mode rules remain Phase 7 work, and public-sharing/media rules remain Phase 8 work.

## Deployment Checklist

1. Provision the Postgres/Supabase database with the `taskbuilder` schema available.
2. Set `APP_JWT_SECRET` to the same shared secret already used by Milo.
3. Set datasource environment variables.
4. Start the backend and confirm `mvn -q -DskipTests compile` or the CI build is green.
5. Verify `GET /api/auth/me` returns `401` without a bearer token.
6. Verify `GET /api/auth/me` returns the current user payload with a valid Milo JWT.

## Scope Reminder

This backend does not implement local login, registration, or shared Milo entities. Phase 6 adds family-aware variant metadata on the existing aggregate while preserving the Phase 5 media-copy boundary, but it still does not include Phase 7 present-mode UI behavior or Phase 8 public media access.
