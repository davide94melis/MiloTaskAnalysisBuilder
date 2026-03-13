# Phase 03 Research

## Goal

Plan Phase 3 so the lightweight Phase 2 task shell becomes a durable task-analysis record with real metadata and editor persistence, without prematurely delivering the richer step-authoring interactions reserved for Phase 4.

## Requirements In Scope

- `META-01`: define task title, category, description, educational objective, and professional notes
- `META-02`: define intended target as a freeform child, group, or audience label without global Milo entities
- `META-03`: define difficulty level, environment of use, and visibility state
- `META-04`: assign a support level profile
- `STEP-08`: save editor changes and preserve step order exactly as configured

## Boundary To Preserve

Phase 2 introduced a lightweight `task_analysis` shell for dashboard/library use. Phase 3 should extend that same record instead of creating a second competing aggregate.

What Phase 3 should add:

- richer task metadata fields
- durable save/update APIs
- minimal ordered step draft persistence needed to satisfy save/reload stability
- a real metadata editing screen for `/tasks/:taskId`

What Phase 3 should not fully deliver yet:

- rich step add/reorder/duplicate/delete UX
- complete step content editing workflow
- media handling
- support variants

This keeps Phase 4 focused on authoring behavior rather than foundational persistence.

## Backend Implications

### Recommended schema evolution

Extend `taskbuilder.task_analysis` with metadata fields instead of replacing the table:

- `description`
- `educational_objective`
- `professional_notes`
- `difficulty_level`
- `environment_label` or reuse/rename the existing context field consistently
- support-level field should remain first-class and normalized in naming

For `STEP-08`, add a separate ordered step-draft table now:

- `taskbuilder.task_analysis_step`
- `id`
- `task_analysis_id`
- `position`
- minimal persisted content fields such as `title` and `description`

Even if Phase 3 does not expose rich step UX, storing ordered draft rows now avoids a later migration from JSON blobs or placeholder counters and makes save/reload stable.

### API strategy

Phase 2 APIs are card-oriented. Phase 3 needs task-detail endpoints:

- `GET /api/tasks/{id}` should return a full editor payload, not only the card shell
- `PUT /api/tasks/{id}` or `PATCH /api/tasks/{id}` should save metadata and ordered steps

Recommended split:

- keep card/list/dashboard DTOs unchanged for library stability
- add a dedicated detail DTO for the editor

This avoids breaking the library contract while allowing the task editor route to become real.

## Frontend Implications

`/tasks/:taskId` is currently a handoff screen. Phase 3 should convert it into a true metadata editor page.

Recommended UI scope:

- editable task header and metadata sections
- target label as freeform input
- support level, difficulty, environment, visibility controls
- notes/objective/description inputs
- minimal step draft section that can render and submit ordered steps already present in the payload

The step area should support persistence and reload, but not full authoring ergonomics yet. A simple ordered list with basic editable fields is enough if it proves save/reload stability.

## Contract Recommendations

### Detail payload

Suggested task detail response:

- card-level fields already used by library
- `description`
- `educationalObjective`
- `professionalNotes`
- `difficultyLevel`
- `environmentLabel`
- `steps: [{ id, position, title, description }]`

### Save payload

Suggested save request:

- metadata fields above
- `steps` array in explicit order

The backend should treat the submitted step array order as authoritative.

## Data Migration Considerations

Phase 2 templates and drafts already exist. Backfill rules should be simple:

- default new metadata columns to nullable or sensible defaults
- generate zero step rows for existing drafts/templates unless a seed template wants initial ordered steps
- keep existing card queries working

## Risks To Avoid

- replacing the Phase 2 card/library contract instead of extending it
- overbuilding the step editor now and consuming Phase 4
- persisting only frontend-local metadata state with no durable backend save contract
- forcing v2 global entities into target selection

## Validation Architecture

Automated checks should cover:

- backend detail read/write contract for metadata and ordered steps
- save/reload fidelity for task metadata
- step order persistence across update and reload
- frontend editor page hydration and save behavior

Existing commands remain appropriate:

- backend: `mvn test`
- frontend tests: `npm test -- --watch=false --browsers=ChromeHeadless`
- frontend build: `npm run build`

Manual verification should be limited to:

- edit task metadata in `/tasks/:taskId`
- save
- refresh the page
- confirm values and step order are preserved

## Planning Recommendation

Use 3 plans in 2 waves:

1. Backend schema/domain/API expansion for metadata and ordered step drafts
2. Frontend task detail editor with save/reload against the new detail contract
3. Cross-stack tests, migration/docs, and verification hardening
