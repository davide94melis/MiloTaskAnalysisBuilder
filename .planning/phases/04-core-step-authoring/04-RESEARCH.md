# Phase 04 Research

## Goal

Plan Phase 4 so the current metadata editor becomes a real step-authoring workflow: users can create, edit, reorder, duplicate, and delete steps, and each step can store the non-media authoring fields needed for real therapist/teacher use.

## Requirements In Scope

- `STEP-01`: add, edit, reorder, duplicate, and delete steps
- `STEP-02`: short title and descriptive text per step
- `STEP-05`: required/optional flag
- `STEP-06`: prompt/support guidance and optional reinforcement notes
- `STEP-07`: estimated time per step

## Starting Point From Phase 3

Phase 3 already established the right aggregate boundary:

- `/api/tasks/{id}` returns a dedicated task detail payload
- `PUT /api/tasks/{id}` saves task metadata plus the ordered step array
- the editor route already hydrates from that payload
- `taskbuilder.task_analysis_step` already exists and is copied during task duplication

What is still intentionally missing:

- creating new step rows from the editor
- editing step content inline
- duplicate/delete actions
- richer step fields beyond `title` and `description`
- a consistent position contract across UI, API, and persistence

## Planning-Relevant Decisions

### 1. Keep Phase 4 on the existing task-detail aggregate

Do not introduce separate step CRUD endpoints in this phase. Keep step authoring inside the existing task detail read/write contract and treat the submitted `steps` array as the source of truth.

Why this is the right Phase 4 choice:

- Phase 3 already verified this aggregate save path
- typical step counts for this product are small enough for whole-document saves
- the frontend can support add/edit/reorder/duplicate/delete locally before one save
- it avoids fragmenting ownership, validation, and test coverage before media arrives

### 2. Extend the existing step table instead of introducing a second step model

Add the new authoring fields directly to `taskbuilder.task_analysis_step`:

- `required` boolean, default `true`
- `support_guidance` text, nullable
- `reinforcement_notes` text, nullable
- `estimated_minutes` integer, nullable

Do not add media placeholders in Phase 4. Phase 5 should own visual-support fields and related validation.

### 3. Normalize position semantics before building richer reorder UX

Current code already has drift:

- frontend normalizes positions as `1..n`
- `TaskDetailService.replaceSteps()` rewrites positions as `0..n-1`
- tests currently assert both styles in different places

Pick one convention and use it everywhere. Recommendation: use `1..n` in persistence, API, and UI because it matches user mental models and simplifies debugging. The plans should lock this in explicitly rather than leaving it implicit.

This decision should be made before planning tasks, otherwise reorder bugs and brittle tests will spread across the phase.

### 4. Preserve the current full-replacement save strategy, but preserve step identity

The service currently deletes all rows and re-inserts the submitted array. That is acceptable for Phase 4 if:

- submitted IDs are preserved for existing steps
- new steps receive generated IDs
- duplicate actions create a new ID
- delete simply omits the step from the submitted array

This keeps backend logic simple while still supporting all Phase 4 operations. If the team later needs audit history, per-step patching, or conflict resolution, that can be a later concern.

### 5. Prefer a clear list editor over advanced drag-and-drop

The success criterion is understandable, fast authoring for professionals, not flashy manipulation. Build a step list editor with:

- add-step action
- inline title/description inputs
- required toggle
- support guidance textarea
- reinforcement notes textarea
- estimated-time input
- duplicate/delete buttons
- explicit move up/down controls

Do not add drag-and-drop unless it is clearly needed after the simpler flow is working. The current frontend does not use `@angular/cdk`, and adding it would expand surface area for modest product value in this phase.

## Backend Implications

### Data model

Extend `TaskAnalysisStepEntity` and related DTOs/mappers with:

- `required`
- `supportGuidance`
- `reinforcementNotes`
- `estimatedMinutes`

Also update step copy logic in `TaskShellService.copySteps()` so duplication preserves the new fields.

### Validation

Recommended validation rules:

- title: nullable while editing, but trim whitespace
- description: nullable
- required: default `true` when missing
- support guidance: nullable
- reinforcement notes: nullable
- estimated minutes: nullable, but reject negative values

Phase 4 should stay permissive enough for draft authoring and avoid over-validating incomplete work.

### Contract shape

The detail response and save request should become:

- `steps: [{ id, position, title, description, required, supportGuidance, reinforcementNotes, estimatedMinutes }]`

Keep the task-level endpoint shape stable and expand only the nested step contract.

## Frontend Implications

The current `TaskShellEditorEntryComponent` is still a metadata-first screen with a minimal reorder panel. Phase 4 should split the step area into a real editor component rather than growing `task-steps-draft-list.component.ts` into a monolith.

Recommended UI structure:

- task shell page remains the route container and save orchestrator
- a dedicated step editor component owns local step list editing behavior
- each step renders as an editable card or row, not read-only text
- authoring controls stay visible without extra navigation

Important UX decisions:

- edits should happen locally and feel immediate
- save remains explicit at the task level
- unsaved changes messaging should mention step edits, not only metadata/order
- empty-state should make adding the first step obvious

## Dependencies And Cross-Phase Notes

- Phase 4 depends on Phase 3 detail persistence and should not re-open the metadata architecture
- Phase 5 media work will extend the same step aggregate, so Phase 4 should leave room on the step card layout for future visual-support sections
- Phase 6 variant duplication depends on step duplication/copy behavior being faithful
- Phase 7 present mode will consume these new step text/support fields, so naming should already fit read-only playback use

## Risks To Plan Around

- position indexing inconsistency causing reorder regressions and confusing tests
- letting the metadata route component absorb too much step-specific UI logic
- over-validating drafts and making the editor slow to use in real workflows
- accidentally pulling Phase 5 media complexity into the step model now
- forgetting to copy new step fields during task duplication
- only testing save success and missing reload fidelity after add/duplicate/delete flows

## Suggested Plan Split

Use 3 plans in 3 waves.

### Wave 1

1. Backend step-model expansion and contract normalization
   - migration for new step fields
   - entity/DTO/mapper/service updates
   - position convention cleanup
   - duplication-copy updates

### Wave 2

2. Frontend core step-authoring UI
   - replace the read-only step list with an editable step authoring component
   - add local add/edit/reorder/duplicate/delete behavior
   - wire new step fields into the existing save flow

### Wave 3

3. Cross-stack verification and docs hardening
   - backend service/controller tests for new fields and operations
   - frontend tests for authoring behavior
   - update planning/docs to record the stable Phase 4 boundary before Phase 5

## Validation Architecture

Automated verification should cover four layers:

1. Backend service tests
   - saving added, edited, duplicated, deleted, and reordered steps
   - preserving submitted order with the chosen position convention
   - defaulting `required` correctly
   - rejecting invalid estimated time values

2. Controller contract tests
   - expanded step payload shape in `GET /api/tasks/{id}`
   - round-trip save via `PUT /api/tasks/{id}` with new step fields

3. Frontend component tests
   - add first step from empty state
   - duplicate step creates a distinct local item
   - delete removes the correct row
   - move up/down changes rendered order
   - task save sends the expanded step payload

4. Manual workflow verification
   - create a new task
   - add several steps with mixed required/optional and time values
   - duplicate and reorder steps
   - delete a middle step and confirm the remaining order stays readable
   - save, refresh, and confirm exact fidelity
   - duplicate the whole task and confirm step content copies correctly
   - confirm the route still reads clearly for therapist/teacher authoring without any media affordances

Verification commands remain:

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`
