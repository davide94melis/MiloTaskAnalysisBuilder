# Phase 05 Research

## Goal

Plan Phase 5 so the current step authoring flow gains practical visual-support authoring: each step can carry symbol, image/photo, and text-based visual supports, and uploaded media remains reliable when the same task is reopened in the editor and later consumed by Phase 7 present mode.

## Requirements In Scope

- `STEP-03`: attach at least one visual support to each step, including symbol, image/photo, or text
- `STEP-04`: combine visual modalities on a step, including symbol + text or photo + text
- `MEDI-01`: upload or attach images/photos for task steps
- `MEDI-02`: deliver uploaded media reliably in both editor and present mode

## Starting Point From Phase 4

Phase 4 left the right aggregate boundary in place for Phase 5:

- `GET /api/tasks/{id}` returns the full task detail payload, including ordered steps
- `PUT /api/tasks/{id}` saves task metadata plus the full ordered step array
- the frontend task route already owns local step editing and explicit save behavior
- `taskbuilder.task_analysis_step` stores the non-media authoring fields and is copied during task duplication

What is still intentionally missing:

- no upload endpoint
- no storage integration
- no symbol catalog or symbol-reference contract
- no step-level visual-support representation in DB, API, or frontend models
- no media reliability strategy for future playback

This means Phase 5 is the first real media slice and should stay narrow: add a v1-capable media pipeline without pulling in present-mode UX or public-sharing authorization rules.

## Planning-Relevant Decisions

### 1. Use relational metadata plus external object storage

Do not store binary files or base64 payloads in Postgres. Use:

- Postgres in the `taskbuilder` schema for media metadata and step associations
- external object storage for uploaded files, using Supabase Storage because Supabase already backs the product database

This is the right v1 choice because:

- image payloads do not belong inside `taskbuilder.task_analysis_step`
- editor and future present mode need stable references, not oversized step rows
- later public-sharing rules in Phase 8 will need asset-level access decisions that are easier when the DB stores metadata and the object store holds bytes

### 2. Keep the task-detail aggregate as the persisted source of truth

Do not split step media authoring into a fully separate CRUD model. Keep media metadata attached to each step inside the existing task detail contract returned by `GET /api/tasks/{id}` and saved by `PUT /api/tasks/{id}`.

However, do not push binary upload through that `PUT`. The pragmatic split is:

- binary upload handled by a dedicated authenticated upload endpoint
- step media selection, ordering, and persistence still saved through the existing task-detail aggregate

This preserves Phase 3 and 4 coherence while avoiding multipart complexity on the main save endpoint.

### 3. Represent v1 visual modalities as explicit per-step slots, not an open-ended media collection

For current repo maturity, the best v1 model is one optional support per modality on each step:

- `visualText`: short readable text intended to be shown as a visual support, separate from instructional description
- `symbol`: optional symbol reference
- `image`: optional uploaded image/photo reference

This meets `STEP-03` and `STEP-04` without introducing a generic media-composition engine. It also matches the likely Milo/Symwriter usage pattern better than an unrestricted gallery.

Recommendation: expose this as a nested `visualSupport` object on each step DTO rather than flattening many new top-level step fields.

Suggested shape:

- `steps: [{ ..., visualSupport: { text, symbol, image } }]`
- `symbol: { library, key, label } | null`
- `image: { mediaId, storageKey, fileName, mimeType, fileSizeBytes, width, height, altText, url } | null`

`url` should be resolved at read time and never persisted as the canonical identifier.

### 4. Treat symbols as references, not uploads

Do not build a symbol-upload system in Phase 5. Symbols should be chosen from a curated catalog and stored as stable references such as:

- `library`
- `key`
- optional human-readable `label`

The actual symbol artwork can live in app-managed static assets or another controlled catalog source. The important Phase 5 planning decision is that steps persist a stable symbol key, not a copied binary blob.

This keeps Phase 5 focused on image/photo upload reliability while still satisfying symbol support.

### 5. Persist stable storage keys, not expiring signed URLs

The DB should store stable identifiers such as:

- bucket or storage namespace
- object key/path
- image metadata needed for rendering and validation

Do not store temporary signed URLs in the database. On task-detail reads, the backend should resolve the image into a currently usable URL or an authenticated media endpoint.

This is critical for `MEDI-02` because:

- signed URLs expire
- editor reloads and Phase 7 playback need fresh access
- Phase 8 sharing will need different authorization rules without rewriting persisted step data

### 6. Use a task-scoped upload handshake so unsaved step editing still works

Phase 4 lets users add new steps locally before saving. Because new local step rows may not yet have durable backend IDs, the upload path should not require a persisted step row first.

Pragmatic recommendation:

- add a task-scoped authenticated upload endpoint such as `POST /api/tasks/{id}/media/uploads`
- upload returns image metadata plus a stable storage key or server-issued media ID
- the frontend attaches that returned metadata to any local step draft
- the next `PUT /api/tasks/{id}` persists the final step-to-image association

This avoids forcing a save-before-upload workflow and keeps the explicit task-level save model intact.

### 7. Keep duplication simple: copy media references first, not physical blobs

When a task is duplicated in Phase 5 or Phase 6, copy the step media metadata and reference the same uploaded image object initially instead of cloning files immediately.

Why this is acceptable now:

- Phase 5 remains authenticated/private only
- duplication already copies step-local data rather than creating version history
- Phase 8 can decide later whether public-sharing duplication needs object cloning or share-safe access rules

This is a non-obvious but important scope control decision. Copying metadata is enough for v1 and avoids expensive storage churn.

## Backend Implications

### Data model

Add a dedicated media metadata table instead of putting image metadata directly on `task_analysis_step`.

Recommended v1 table:

- `taskbuilder.task_analysis_step_media`
  - `id uuid primary key`
  - `task_analysis_step_id uuid not null references taskbuilder.task_analysis_step(id) on delete cascade`
  - `kind text not null` with constrained values such as `image`
  - `storage_provider text not null` such as `supabase`
  - `storage_bucket text not null`
  - `storage_key text not null`
  - `file_name text`
  - `mime_type text not null`
  - `file_size_bytes bigint`
  - `width integer`
  - `height integer`
  - `alt_text text`
  - `created_at timestamptz`
  - `updated_at timestamptz`

Then extend `taskbuilder.task_analysis_step` with only the modality-selection metadata:

- `visual_text text`
- `symbol_library text`
- `symbol_key text`
- `symbol_label text`

This split is pragmatic:

- text and symbol are lightweight step metadata
- uploaded images deserve their own metadata row
- v1 still supports only one uploaded image per step by enforcing one `image` row per step in service logic

### Contract changes

Expand the nested step DTOs in both `TaskDetailResponse` and `UpdateTaskRequest` to include:

- `visualSupport.text`
- `visualSupport.symbol`
- `visualSupport.image`

Keep `GET /api/tasks/{id}` and `PUT /api/tasks/{id}` as the authoritative read/write boundary for step composition.

Add one dedicated authenticated upload endpoint, likely multipart:

- `POST /api/tasks/{taskId}/media/uploads`

The response should return a backend-approved image descriptor that can be inserted into the step draft and then round-tripped through the main aggregate save.

### Service behavior

`TaskDetailService.replaceSteps()` currently deletes all step rows and re-inserts them. That is still workable in Phase 5, but the plans must explicitly preserve step identity for existing rows so image associations survive save operations.

Two viable ways exist:

- preserve submitted step IDs and re-create matching media rows during replacement
- or stop doing hard delete/reinsert and switch to a diff/update strategy for steps with media

For current maturity, preserving submitted step IDs and rebuilding associated media metadata is the lower-risk Phase 5 choice.

### Validation rules

Recommended server-side validation:

- allow any combination of `visualText`, `symbol`, and `image`, but require at least one to satisfy `STEP-03`
- trim text values and treat blank visual text as null
- reject unsupported mime types
- enforce a practical size cap for uploads
- require uploaded image references used in `PUT` to belong to the current authenticated owner/task
- reject dangling image references that do not exist in storage metadata

### Reliability contract

Media reliability in Phase 5 depends on one rule: the saved step should contain a stable image reference that the backend can resolve on every task-detail read.

The likely backend options are:

- return a fresh signed URL in `GET /api/tasks/{id}`
- or return a stable authenticated backend media URL that streams or redirects

Recommendation: prefer a backend-owned media URL or backend-mediated redirect if implementation effort is reasonable. It centralizes auth, keeps the frontend simple, and gives Phase 8 a cleaner place to extend authorization later.

## Frontend Implications

The current step editor is a non-media form. Phase 5 should extend it with a dedicated visual-support section per step rather than scattering image/symbol controls across the whole task route.

Recommended authoring behavior:

- each step card gets a `Visual support` area
- the user can add or remove:
  - short visual text
  - one symbol reference
  - one uploaded image/photo
- local previews appear immediately after upload response
- task save remains explicit and still persists the whole step array

Important frontend model updates:

- `TaskStepDraftRecord` needs a nested `visualSupport` field
- upload state should stay local and separate from persisted save state
- the editor needs clear distinction between:
  - step instructional fields like `description` and `supportGuidance`
  - step visual supports intended for the child-facing surface

Recommended UX guardrails:

- do not force upload before the user fills the rest of the step
- keep symbol selection lightweight, likely a simple picker from a small catalog
- show upload errors inline on the relevant step card
- show when an uploaded image is attached locally but not yet persisted via task save

The visual layout should remain Milo/Symwriter-compatible but not try to solve final playback styling in this phase.

## Dependencies And Cross-Phase Notes

- Phase 5 depends on the Phase 4 step-authoring boundary staying intact; do not replace the task-detail aggregate with separate media-first CRUD endpoints
- Phase 6 variant duplication should reuse the same media-copy behavior as task duplication, so copy logic must include symbol/text/image metadata
- Phase 7 present mode should consume the same saved `visualSupport` contract instead of inventing a second playback-specific media model
- Phase 8 sharing should authorize asset exposure from stable storage keys and backend rules, which is why Phase 5 should not persist public URLs
- `MEDI-03` is intentionally out of scope here; Phase 5 only needs an authenticated reliability model that does not block later public exposure rules

## Risks To Plan Around

- over-designing a generic media system when v1 only needs one image, one symbol reference, and one visual text support per step
- tying upload directly to persisted step IDs and breaking the current local-first step authoring flow
- storing expiring URLs and discovering later that present mode or reload breaks after token expiry
- letting `TaskDetailService.replaceSteps()` orphan or drop media associations during normal saves
- conflating instructional description text with child-facing visual text and creating unclear playback semantics
- building symbol support as uploaded files instead of stable references, which would add avoidable complexity
- forgetting to extend duplicate-task flows so copied tasks keep visual supports intact

## Suggested Plan Split

Use 3 plans in 3 waves.

### Wave 1

1. Backend media foundation and schema
   - add media metadata table and step symbol/text fields
   - add storage integration configuration
   - add upload endpoint and validation
   - expand task detail DTOs and mapper for `visualSupport`

### Wave 2

2. Frontend media authoring in the existing step editor
   - extend step draft models with `visualSupport`
   - add image upload flow with local preview and inline error states
   - add symbol picker and visual-text fields
   - keep explicit task-level save on the existing route

### Wave 3

3. Duplication, reliability hardening, and docs/tests
   - copy media metadata during task duplication
   - prove reload fidelity through backend and frontend tests
   - document the authenticated media contract for future present mode and sharing phases

## Validation Architecture

Automated verification should cover five layers:

1. Backend service tests
   - saving steps with image, symbol, text-only, and mixed modality combinations
   - rejecting a step that has no visual support at all
   - preserving media associations across normal reorder/edit saves
   - copying media metadata during duplication

2. Upload endpoint tests
   - authenticated upload succeeds for supported image types
   - unsupported mime type or oversize payload fails cleanly
   - upload response returns the metadata shape required by the frontend draft model

3. Controller contract tests
   - `GET /api/tasks/{id}` returns nested `visualSupport` data with resolved image access URL
   - `PUT /api/tasks/{id}` round-trips mixed-modality step payloads without losing order

4. Frontend component tests
   - add visual text to a step and persist it
   - attach a symbol and keep it after save/reload
   - upload an image, preview it locally, save the task, and keep it after reload
   - combine photo + text and symbol + text on separate steps
   - show upload failure without discarding the rest of the step draft

5. Manual workflow verification
   - create a task with one text-only visual step, one symbol + text step, and one photo + text step
   - save, refresh, and confirm exact media fidelity
   - duplicate the task and confirm all visual supports remain usable
   - confirm the editor still reads as a therapist/teacher workflow rather than a media manager
   - confirm task detail responses always produce usable media URLs in a fresh session

Verification commands remain:

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`
