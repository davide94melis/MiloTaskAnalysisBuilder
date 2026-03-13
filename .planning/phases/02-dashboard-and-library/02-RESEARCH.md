# Phase 02 Research

## Goal

Plan Phase 2 so the product gains a real operational home and library without prematurely building the full task-analysis editor domain promised in Phase 3.

## Requirements In Scope

- `LIBR-01`: create a new task analysis from scratch
- `LIBR-02`: view a library of task cards with title, step count, support level, sharing state, and last update
- `LIBR-03`: filter library by category, context, target label, author, status, and support level
- `LIBR-04`: save a task analysis as draft and later reopen it
- `LIBR-05`: duplicate an existing task analysis into the user's own space
- `LIBR-06`: start from at least one seed template
- `UX-02`: dashboard feels operational and reassuring rather than technical

## Planning Boundary

Phase 2 should establish a lightweight "task shell" model rather than the full authoring data model. The shell is enough for dashboard and library flows:

- task id
- title
- category
- target label
- support level
- context/environment label
- status (`draft`, `template`)
- visibility summary
- step count
- last updated at
- owner id
- source task id for duplication lineage

This boundary preserves room for Phase 3 to add full metadata semantics and durable editor persistence without forcing throwaway UI now.

## Architecture Guidance

### Backend

The backend currently only exposes auth bootstrap. Phase 2 needs a thin library API layer on top of the authenticated user:

- create draft task shell
- list dashboard highlights
- list/filter task library
- duplicate task shell
- list seed templates

Recommended package split:

- `library` or `tasklibrary` package for controllers, DTOs, and query objects
- `task` package for minimal task shell entity/repository/service

Recommended initial persistence:

- `taskbuilder.task_analysis`
- optional seed rows inserted through Flyway or an application bootstrap component

Avoid introducing step tables in this phase unless required solely for `step_count`. `step_count` can start as an integer field on the shell and be made authoritative in later phases.

### Frontend

The current authenticated shell is a placeholder. Phase 2 should convert it into:

- a proper routed shell with dashboard as the default page
- a library page with card grid/list and filter bar
- a small template picker or "new task" flow

Recommended route structure:

- `/` or `/dashboard`
- `/library`
- `/tasks/new`
- `/tasks/:taskId`

`/tasks/:taskId` can be a placeholder reopen handoff page in this phase if the editor is not ready yet. The requirement only needs reopenability, not full authoring depth.

## UX Direction

The dashboard must feel like an educator tool, not an admin console. The UI should surface:

- recent drafts
- seed templates
- quick actions
- categories or work contexts
- empty-state guidance that reassures rather than instructs like developer software

Library cards should emphasize operational signals:

- task name
- mini metadata summary
- step count
- support level
- sharing state
- updated-at

Filters should remain flat and practical. Avoid advanced query-builder UX.

## API Contract Recommendations

Recommended endpoints:

- `POST /api/tasks` creates an empty or template-based draft shell
- `GET /api/tasks` returns filtered library results
- `GET /api/tasks/dashboard` returns recent drafts, templates, and simple counters
- `POST /api/tasks/{id}/duplicate` duplicates a task into the current user's space
- `GET /api/templates` returns seed templates

Recommended filter query params:

- `category`
- `context`
- `targetLabel`
- `author`
- `status`
- `supportLevel`
- `search`

Recommended response shape for cards:

- id
- title
- category
- targetLabel
- supportLevel
- visibility
- status
- stepCount
- lastUpdatedAt
- authorName
- previewSteps optional and capped

## Data And Seeding Notes

Seed templates should be first-party records in the same schema with `status=template` or `is_template=true`. This keeps duplication simple and avoids a separate content subsystem in v1.

Recommended initial seed set:

- Lavarsi le mani
- Preparare lo zaino
- Routine del mattino

Create-from-scratch should also be available and should produce a draft shell immediately so the user can re-open it later.

## Risks To Avoid

- Building the full editor now and collapsing Phase 2 into Phase 3
- Designing filters around future global Milo entities instead of freeform v1 fields
- Treating dashboard as KPI analytics instead of operational shortcuts
- Overfitting to generic admin tables instead of task cards
- Hard-coding fake frontend-only data that becomes unusable in Phase 3

## Suggested Plan Split

### Wave 1

- Backend task shell and library/template API foundation
- Frontend operational shell, dashboard, library routes, card/filter UI, and create/reopen/duplicate entry points

### Wave 2

- Integration, test coverage, seed template verification, and docs describing the phase-2 contracts for later phases

## Validation Architecture

The phase should be validated with the existing stack-specific commands:

- backend quick/full: `mvn test`
- frontend quick/full: `npm test -- --watch=false --browsers=ChromeHeadless`
- frontend build guard: `npm run build`

Because UX-02 is partially qualitative, add one manual verification path:

- authenticated user lands on a reassuring dashboard with obvious next actions and non-technical copy

Automated checks should cover:

- authenticated task creation returns a draft shell
- library filtering/duplication/template endpoints behave as expected
- dashboard and library components render cards and filter state correctly

## Planning Recommendation

Use 3 plans in 2 waves:

1. Backend library foundation for task shells, filters, duplication, and templates
2. Frontend dashboard/library shell and routes
3. Cross-stack tests, integration checks, and docs
