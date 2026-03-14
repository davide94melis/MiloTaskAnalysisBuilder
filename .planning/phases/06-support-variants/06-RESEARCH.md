# Phase 06 Research

## Goal

Plan Phase 6 so users can create and manage related task-analysis variants for different support levels by building on the existing duplicate-task flow, while keeping the saved task aggregate, authenticated media boundary, and single-user ownership model intact.

## Requirements In Scope

- `SUPP-01`: create multiple versions of the same task analysis for different support levels
- `SUPP-02`: duplicate an existing task analysis as the starting point for a simpler or more autonomous variant
- `SUPP-03`: distinguish variants through support-level metadata and visible labeling in the library

## Starting Point From Phase 5

Phase 5 left the right boundary in place for support variants:

- task duplication already creates a new `task_analysis` shell and copies all ordered step content
- duplication already copies Phase 5 visual-support metadata and step media references instead of inventing a second media system
- `task_analysis` already stores first-class `support_level` and immediate duplication lineage through `source_task_id`
- the library and editor already consume card/detail payloads from the same backend aggregate
- the authenticated preview route proves saved media outside the editor, so Phase 6 can trust the saved task contract without owning present-mode behavior

What is still missing:

- no stable way to group sibling variants that were duplicated from each other over time
- no variant-specific create flow distinct from generic copy
- no card/editor surface that shows parent-task and sibling-variant relationships
- no backend query or DTO support for variant family summaries

This means Phase 6 should stay narrow: add family-aware duplication and family-aware browsing, not a version-history engine, not collaborative assignment, and not guided playback rules.

## Planning-Relevant Decisions

### 1. Build variants on top of duplication, not beside it

Do not create a separate versioning subsystem. Phase 6 should treat "create variant" as a specialized duplicate flow:

- start from an existing saved task
- clone task shell metadata, ordered steps, and Phase 5 media references
- override only the variant-specific metadata the user is setting now, primarily `supportLevel` and optionally title
- preserve the current explicit save model for later edits

This satisfies `SUPP-02` without replacing the duplication behavior already proven in Phases 2, 4, and 5.

### 2. Add a lightweight variant family anchor to `task_analysis`

`source_task_id` is useful lineage but is not enough to group all siblings reliably once a variant is created from another variant. The pragmatic v1 addition is one nullable family anchor field on `taskbuilder.task_analysis`:

- `variant_family_id uuid references taskbuilder.task_analysis(id)`

Recommended semantics:

- standalone task: `variant_family_id = null`
- first variant created from a standalone task: new task gets `source_task_id = base.id` and `variant_family_id = base.id`
- variant created from an existing variant: new task gets `source_task_id = current.id` and `variant_family_id = current.variant_family_id ?? current.id`
- the original base task remains the family anchor and does not need a second record or separate family table

This is enough for v1 because:

- the family root is always a real task the user can still open and edit
- grouping queries stay simple
- there is no need for branching metadata, publish states, merge logic, or historical diffs

### 3. Keep support level as task metadata, but make it effectively required for variant flows

`supportLevel` already exists on every task shell and should remain the primary visible distinguisher for variants. Do not create a second "variant support level" field.

Recommended rule:

- all tasks may still technically exist without `supportLevel`
- variant creation should require a non-blank `supportLevel`
- library/editor labeling should prioritize `supportLevel` when a task belongs to a variant family

This keeps `META-04` and `SUPP-03` aligned instead of creating two overlapping concepts.

### 4. Keep generic duplicate and variant creation as separate user intents

Phase 6 should not overload the existing `Duplicate` action with hidden variant semantics. Keep:

- `Duplicate`: generic copy with current behavior
- `Create variant`: duplicate-plus-family behavior with support-level override

That avoids surprising existing flows and lets Phase 6 stay explicit without broad UX polish.

### 5. Use visible labeling and lightweight grouping, not complex nested management screens

The library should remain card-first. The v1-friendly variant UX is:

- show a variant badge such as `Variante` on cards in a family
- show the support-level label prominently on every family member
- group related tasks by family root in the library response or client state
- let users expand or visually scan sibling variants without introducing tree editors, assignment panels, or batch management tools

The editor should add a simple family panel, not a new workspace:

- current task role: base task or variant
- base task title
- sibling variants with support levels
- action to create another variant from the current saved task
- quick navigation between family members

### 6. Reuse the Phase 5 media boundary exactly

Variant creation should reuse current duplication behavior for steps and media:

- copy step rows into the new task
- copy `task_analysis_step_media` metadata rows
- reuse the same saved storage keys and media descriptors

Do not clone files, create new storage buckets, or invent variant-specific media resolution. Phase 5 already established the stable private-media boundary; Phase 6 should simply inherit it.

## Backend Implications

### Recommended schema evolution

Extend `taskbuilder.task_analysis` with the minimum extra lineage needed for family grouping:

- `variant_family_id uuid references taskbuilder.task_analysis(id)`

Recommended index additions:

- index on `variant_family_id`
- optional composite index on `(owner_id, variant_family_id, updated_at desc)` if library grouping queries need it

Do not add:

- a separate variant table
- workspace ownership tables
- assignment records
- version snapshots or historical revisions

### Service and duplication behavior

`TaskShellService` already contains the correct copy boundary. Phase 6 should refactor that service so both generic duplicate and create-variant flows share the same copy primitives.

Recommended service behavior:

- keep current `duplicate(...)` semantics unchanged
- add `createVariant(sourceTaskId, ownerId, ownerEmail, request)` that:
  - validates source accessibility
  - resolves `variant_family_id` from source task
  - creates a copied draft
  - overrides `supportLevel`
  - optionally applies a title override or suffix
  - copies steps and step media exactly as current duplicate does

Recommended title handling:

- keep title override optional
- if omitted, default to the source title
- rely on visible support-level labeling rather than forcing title mutation

That keeps the data model cleaner and avoids title drift becoming the only way to distinguish variants.

### DTO and query additions

The card/detail contracts need family context so the frontend does not reconstruct it manually.

Recommended card-level additions:

- `variantFamilyId: UUID | null`
- `variantRootTaskId: UUID | null`
- `variantRootTitle: String | null`
- `variantRole: "standalone" | "root" | "variant"`
- `variantCount: int`

Recommended detail-level additions:

- the same current-task family fields
- a compact `relatedVariants` array with sibling card summaries for navigation

This is more pragmatic than inventing a dedicated family-management endpoint first, because the current frontend is already card/detail driven.

### Library query strategy

Library listing can stay flat at the API boundary if each card contains enough family metadata. The backend should still compute family summaries efficiently so the frontend can render:

- standalone cards with no extra grouping UI
- root cards with an indicator that variants exist
- variant cards grouped under their family root or visually tied to it

The root title should come from the family anchor task, not from the immediate `source_task_id`, so chains do not fragment.

### Validation rules

Recommended server-side validation:

- creating a variant requires a non-blank `supportLevel`
- if the requested `supportLevel` matches the source exactly, allow it but treat it as a low-value duplicate rather than blocking; Phase 6 does not need opinionated taxonomy enforcement
- only the task owner can create or edit private variants unless the source is an allowed template
- family linkage must always point to an accessible task root, not an arbitrary foreign record

## Frontend Implications

### Library

The library is where `SUPP-03` becomes visible. Keep the current page and card architecture, but add family-aware rendering:

- card badges for `Base` / `Variante`
- support level shown as the main differentiator
- lightweight grouping by base task in the results grid or an expandable stack per family
- dedicated `Create variant` action on cards that already represent a reusable starting point

Recommended rendering rule:

- standalone tasks remain single cards
- tasks with `variantRole = root` display a family summary and can reveal sibling variants
- tasks with `variantRole = variant` show the base title and current support level clearly

This preserves the current library mental model and avoids introducing separate pages for variant administration.

### Editor

The editor already owns duplication and saved-task navigation, so it is the right place for family management.

Recommended additions on `/tasks/:taskId`:

- a `Variant family` side-panel section near the existing actions/status area
- current-task family status: standalone, base, or variant
- base-task title and support level
- sibling variant links with support-level labels
- `Create variant from this task` action

Important scope guardrails:

- do not add comparison diff views
- do not add automatic content simplification
- do not add child/group assignment logic
- do not add guided playback shortcuts beyond current preview behavior

### Variant creation interaction

The minimal viable UI can be a lightweight prompt or form step that asks for:

- support level
- optional title override

After that, navigate directly to the new copied task editor. The user can adjust steps manually, which fits the current explicit-save workflow.

### Metadata interaction

Support level remains editable in the current metadata form. Phase 6 should add only small guidance:

- when editing a family member, changing support level changes how that variant is labeled everywhere
- the base/variant relationship is independent of environment, target label, and visibility
- no extra target, child, class, or team fields should appear

## Dependencies And Cross-Phase Notes

- Phase 6 depends on Phase 5 duplication already copying step media metadata correctly; do not reopen media architecture
- Phase 6 should not absorb Phase 7 present-mode concerns; sibling switching is editor/library navigation, not playback flow
- Phase 6 should not absorb Phase 8 sharing concerns; variant families remain private/template-scoped unless a later sharing phase exposes them
- v1 still has no Milo global children/classes and no team workspace model, so variants stay user-owned task records with freeform target labels
- future Phase 8 public duplication can decide whether family metadata is exposed publicly; Phase 6 only needs authenticated/private behavior
- future v2 automation can generate candidate variants, but Phase 6 should assume all variants are user-created copies

## Risks To Plan Around

- relying only on `source_task_id` and discovering later that sibling grouping breaks after duplicate-from-variant chains
- overloading generic duplicate with hidden variant semantics and confusing existing users
- adding a separate variant/version engine when the repo already has a working copy-based aggregate
- making support level optional in variant creation and losing the main visible differentiator required by `SUPP-03`
- letting the library UI become a nested management console instead of a readable card workflow
- accidentally pulling in collaboration, assignment, or public-sharing assumptions that the current data model does not support
- breaking Phase 5 media fidelity by trying to deep-clone uploaded files

## Suggested Plan Split

Use 4 plans in 3 waves.

### Wave 1

1. Backend variant family foundation
   - add `variant_family_id` migration and repository/query support
   - extend DTOs with family summary fields
   - add service helpers that resolve family root from current duplication lineage

### Wave 2

2. Variant creation flow on top of duplication
   - add backend create-variant endpoint or request shape using existing copy logic
   - require support-level input for that flow
   - preserve step/media duplication exactly as Phase 5 implemented it

3. Library family grouping and labeling
   - extend card models with family metadata
   - render base/variant badges and support-level labels
   - add a clear `Create variant` action without removing `Duplicate`

### Wave 3

4. Editor family panel, navigation, and verification hardening
   - show related variants on the task editor page
   - allow quick navigation across siblings
   - add tests for family grouping, family-aware creation, and media-preserving variant duplication

## Validation Architecture

Automated verification should cover six layers:

1. Backend service tests
   - creating a first variant from a standalone task
   - creating a second-generation variant from an existing variant while preserving the same family root
   - keeping generic duplicate behavior unchanged
   - copying ordered steps and Phase 5 media metadata into variants

2. Repository/query tests
   - library queries return family summary fields correctly
   - root and sibling counts remain correct for mixed standalone and variant tasks

3. Controller contract tests
   - create-variant request enforces support level
   - task card/detail payloads include family metadata and related variants where expected

4. Frontend service tests
   - library models map new family fields
   - create-variant request uses the expected endpoint/payload

5. Frontend component tests
   - library cards/grouping visually distinguish base and variant tasks
   - editor family panel shows sibling variants and current role correctly
   - creating a variant navigates to the new copied task

6. Manual workflow verification
   - create a base task with saved mixed media
   - create `Guidato`, `Visivo`, and `Autonomo` variants from it or from each other
   - confirm all siblings appear under one family grouping in the library
   - open each variant and confirm support-level labeling plus step/media fidelity
   - confirm no collaboration, assignment, or public-sharing complexity appears in the flow

Verification commands:

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`
