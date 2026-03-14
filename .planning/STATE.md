---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-03-14T02:26:38.110Z"
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 25
  completed_plans: 23
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.
**Current focus:** Phase 7 guided present mode is in progress. The repo now has the authenticated present-route foundation and can iterate on layout, controls, and launch integration on top of the saved-task contract.

## Status

- Project initialized
- Config created
- Research completed
- Requirements defined
- Roadmap created
- Phase 1 executed and verified
- Phase 2 executed and verified
- Phase 3 executed and verified
- Phase 4 executed and verified
- Phase 5 Plan 05-01 executed and verified
- Phase 5 Plan 05-02 executed and verified
- Phase 5 Plan 05-03 executed and verified
- Phase 5 Plan 05-04 executed and verified
- Phase 5 Plan 05-05 executed and verified
- Phase 6 Plan 06-01 executed and verified
- Phase 6 Plan 06-02 executed and verified
- Phase 6 Plan 06-03 executed and verified
- Phase 6 Plan 06-04 executed and verified
- Phase 7 Plan 07-01 executed and verified
- Phase 7 Plan 07-02 executed and verified

## Active Milestone

- Building V1 MVP with Milo SSO, task authoring, present mode, sharing, basic tracking, and PDF export

## Next Command

- `Execute Phase 7 plan 07-03`

## Recent Decisions

- Phase 5 media uploads are task-scoped and authenticated, with saved step composition still owned by `GET/PUT /api/tasks/{id}`.
- Saved media descriptors persist stable metadata and storage keys while authenticated media URLs are resolved at read time.
- Frontend step drafts keep upload progress and pending-persistence state locally while explicit task save remains the only persistence boundary.
- Step authoring uses a nested `visualSupport` object so symbol, text, and image combinations round-trip through the backend contract unchanged.
- Task duplication copies visual supports by reusing saved media references and metadata rather than cloning image objects.
- Phase 5 playback proof uses an authenticated `/tasks/:taskId/preview` route that fetches saved task detail outside the editor surface.
- The preview route is a verification-oriented, read-only proof of saved media playback and does not replace the fuller guided present mode planned for Phase 7.
- Variant families are modeled as copy-based task lineages using a nullable `variant_family_id` anchor separate from `source_task_id`.
- Library cards now expose `variantRole`, family root metadata, and family counts without introducing a version history engine or collaboration rules.
- Generic duplicate remains outside variant-family semantics until the dedicated create-variant flow is implemented.
- Create-variant requests now use the existing `POST /api/tasks` entry point with `variantSourceTaskId` plus required `supportLevel`, while generic duplicate stays on `POST /api/tasks/{taskId}/duplicate`.
- Variant creation resolves the family root from `source.variantFamilyId ?? source.id` and reuses the exact Phase 5 step/media copy boundary without cloning files.
- Library cards now keep `supportLevel` as the dominant label, with standalone/root/variant badges and family counts as secondary cues.
- The library's `Create variant` action stays explicit beside generic duplicate and uses the backend `POST /api/tasks` variant request contract directly.
- Task detail responses now populate root-family metadata and `relatedVariants` so the editor route can render sibling navigation without reconstructing families client-side.
- The editor route now shows a compact family panel with root/variant labeling, sibling navigation, and an explicit create-variant action that preserves the existing save boundary.
- Phase 6 support variants remain duplication-based task families; guided present mode and sharing are still deferred to Phases 7 and 8.
- Guided present mode now has a dedicated authenticated `/tasks/:taskId/present` route separate from the Phase 5 preview proof.
- The first present-mode session model is local-only: route loads reset `currentStepIndex` and `completedStepIndexes`, and no persisted session writes were introduced.
- Zero-step tasks, load failures, and session completion now render intentional present-mode states instead of falling through to broken controls.
- Guided present mode now uses a child-facing responsive surface with explicit phone, tablet, and desktop layout states instead of proof-style framing.
- Present mode continues to render only saved `visualSupport` content and keeps facilitator guidance hidden by default behind an explicit secondary toggle.

## Constraints To Preserve

- Java REST backend on Render
- Angular frontend on Vercel
- Supabase with dedicated schema separate from `milo`
- V1 uses Milo only for SSO
- UI must remain visually compatible with Symwriter and Milo

## Session Continuity

- Stopped at: Completed 07-02-PLAN.md
- Resume file: None
