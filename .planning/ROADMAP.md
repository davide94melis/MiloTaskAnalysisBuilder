# Milo Task Analysis Builder Roadmap

## Proposed Roadmap

**10 phases** | **47 requirements mapped** | All v1 requirements covered

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 1 | Complete | 2026-03-13 |
| 2 | Complete | 2026-03-13 |
| 3 | Complete | 2026-03-13 |
| 4 | Complete | 2026-03-13 |
| 5 | Complete | 2026-03-14 |
| 6 | Complete | 2026-03-14 |

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Milo SSO Foundation | Let Milo-authenticated users enter and use the app securely with app-specific authorization. | AUTH-01, AUTH-02, AUTH-03 | 3 |
| 2 | Dashboard And Library | Provide an operational home and library where users can create, find, filter, reopen, duplicate, and start from templates. | LIBR-01, LIBR-02, LIBR-03, LIBR-04, LIBR-05, LIBR-06, UX-02 | 4 |
| 3 | Task Metadata And Persistence | Establish the task-analysis domain model, metadata fields, and durable save behavior. | META-01, META-02, META-03, META-04, STEP-08 | 4 |
| 4 | Core Step Authoring | Deliver the editable step-by-step authoring experience without rich media complexity yet. | STEP-01, STEP-02, STEP-05, STEP-06, STEP-07 | 4 |
| 5 | Media Support Pipeline | Add image/photo/symbol support and make media reliable in editing and playback contexts. | STEP-03, STEP-04, MEDI-01, MEDI-02 | 4 |
| 6 | Support Variants | Let users create and manage task variants for different support levels. | SUPP-01, SUPP-02, SUPP-03 | 3 |
| 7 | Guided Present Mode | Turn tasks into a usable session-ready step-by-step experience across devices. | PRES-01, PRES-02, PRES-03, PRES-04, PRES-05, PRES-06 | 4 |
| 8 | Safe Sharing And Public Access | Enable public links and duplication while protecting private data and assets. | SHAR-01, SHAR-02, SHAR-03, SHAR-04, SHAR-05, MEDI-03 | 4 |
| 9 | Minimal Session Tracking | Record basic session completions and expose simple usage history to authenticated users. | SESS-01, SESS-02, SESS-03 | 3 |
| 10 | PDF Export And UX Polish | Deliver print-ready export and align the whole app with Milo/Symwriter visual standards. | EXPT-01, EXPT-02, EXPT-03, UX-01, UX-03 | 4 |

## Phase Details

### Phase 1: Milo SSO Foundation

Goal: Let Milo-authenticated users enter and use the app securely with app-specific authorization.

Requirements: AUTH-01, AUTH-02, AUTH-03

Success criteria:
1. User can access the app through Milo SSO without creating a second account.
2. User session survives normal browser refresh and reaches protected routes safely.
3. Backend authorizes API requests using Milo-issued identity plus app-specific access rules.

### Phase 2: Dashboard And Library

Goal: Provide an operational home and library where users can create, find, filter, reopen, duplicate, and start from templates.

Requirements: LIBR-01, LIBR-02, LIBR-03, LIBR-04, LIBR-05, LIBR-06, UX-02

Success criteria:
1. User lands on a dashboard that feels operational and reassuring rather than technical.
2. User can create a new task, reopen drafts, and browse a library of task cards.
3. User can filter the library by the agreed metadata fields.
4. User can duplicate an existing task and start from at least one seed template.

### Phase 3: Task Metadata And Persistence

Goal: Establish the task-analysis domain model, metadata fields, and durable save behavior.

Requirements: META-01, META-02, META-03, META-04, STEP-08

Success criteria:
1. User can define all required task metadata including target label without global Milo entities.
2. User can assign visibility and support-level metadata to each task.
3. Task data persists cleanly and can be reopened without loss.
4. Step order and editor changes remain stable after save and reload.

### Phase 4: Core Step Authoring

Goal: Deliver the editable step-by-step authoring experience without rich media complexity yet.

Requirements: STEP-01, STEP-02, STEP-05, STEP-06, STEP-07

Success criteria:
1. User can add, edit, reorder, duplicate, and delete steps.
2. Each step supports title and descriptive text.
3. User can define required/optional flags, support guidance, reinforcement notes, and estimated time.
4. The editor remains fast and understandable for real therapist/teacher workflows.

### Phase 5: Media Support Pipeline

Goal: Add image/photo/symbol support and make media reliable in editing and playback contexts.

Requirements: STEP-03, STEP-04, MEDI-01, MEDI-02

Success criteria:
1. User can upload or attach images/photos and add symbol-based supports to steps.
2. User can combine modalities such as symbol + text or photo + text.
3. Media loads reliably in both the editor and later present-mode contexts.
4. Media handling does not break the step authoring flow.

### Phase 6: Support Variants

Goal: Let users create and manage task variants for different support levels.

Requirements: SUPP-01, SUPP-02, SUPP-03

Success criteria:
1. User can create multiple versions of the same task for different support levels.
2. User can start a variant by duplicating an existing task analysis.
3. Variants are clearly labeled and distinguishable in the library.

### Phase 7: Guided Present Mode

Goal: Turn tasks into a usable session-ready step-by-step experience across devices.

Requirements: PRES-01, PRES-02, PRES-03, PRES-04, PRES-05, PRES-06

Success criteria:
1. User can launch a task in present mode from the authenticated app.
2. Present mode shows one clear current step with large visual focus and minimal distraction.
3. User can move backward and forward between steps and complete the current step with one prominent action.
4. Present mode is usable on tablet, phone, and desktop and ends in a clear completion state.

### Phase 8: Safe Sharing And Public Access

Goal: Enable public links and duplication while protecting private data and assets.

Requirements: SHAR-01, SHAR-02, SHAR-03, SHAR-04, SHAR-05, MEDI-03

Success criteria:
1. User can generate a public view link and a public interactive link.
2. Public links open without authentication when allowed.
3. Public access exposes only intended task data and only required media assets.
4. Authenticated recipients can duplicate a shared task into their own space.

### Phase 9: Minimal Session Tracking

Goal: Record basic session completions and expose simple usage history to authenticated users.

Requirements: SESS-01, SESS-02, SESS-03

Success criteria:
1. Completing a task in present mode can save a minimal session record.
2. Session records contain task ID, access context, completion date, step count, and completion status.
3. Authenticated users can see a basic history or count of completed sessions for their tasks.

### Phase 10: PDF Export And UX Polish

Goal: Deliver print-ready export and align the whole app with Milo/Symwriter visual standards.

Requirements: EXPT-01, EXPT-02, EXPT-03, UX-01, UX-03

Success criteria:
1. User can export a task analysis to printable PDF.
2. Export preserves step order, text, and visual supports in a practical layout.
3. Core workflows feel visually and interaction-wise compatible with Milo and Symwriter.
4. Create, edit, present, share, and export flows are understandable without training-heavy UI.

## Sequencing Logic

- The roadmap starts with identity because Milo SSO is a hard prerequisite.
- Library and metadata come before complex authoring so the domain model has a stable shell.
- Media comes after basic authoring to avoid entangling upload complexity with initial editor flow.
- Present mode lands before sharing because public interactive links depend on it.
- Tracking follows present mode because sessions only make sense after playback exists.
- Export and global UX polish finish the MVP once the core loop is proven.

## Phase 1 Next

Completed on 2026-03-13. Verification passed in `.planning/phases/01-milo-sso-foundation/01-VERIFICATION.md`.

## Phase 2 Next

Completed on 2026-03-13. Verification passed in `.planning/phases/02-dashboard-and-library/02-VERIFICATION.md`.

## Phase 3 Next

Completed on 2026-03-13. Verification passed in `.planning/phases/03-task-metadata-and-persistence/03-VERIFICATION.md`.

## Phase 4 Next

Completed on 2026-03-13. Verification passed in `.planning/phases/04-core-step-authoring/04-VERIFICATION.md`.

## Phase 5 Next

Completed on 2026-03-14. Summaries:

- `.planning/phases/05-media-support-pipeline/05-01-SUMMARY.md`
- `.planning/phases/05-media-support-pipeline/05-02-SUMMARY.md`
- `.planning/phases/05-media-support-pipeline/05-03-SUMMARY.md`
- `.planning/phases/05-media-support-pipeline/05-04-SUMMARY.md`
- `.planning/phases/05-media-support-pipeline/05-05-SUMMARY.md`

Next up: plan Phase 6 for support variants on top of the now-stable media duplication boundary and the authenticated preview proof. Phase 7 still owns guided present mode behavior, and Phase 8 still owns any public media access surface.

## Phase 6 Next

Completed on 2026-03-14. Summaries:

- `.planning/phases/06-support-variants/06-01-SUMMARY.md`
- `.planning/phases/06-support-variants/06-02-SUMMARY.md`
- `.planning/phases/06-support-variants/06-03-SUMMARY.md`
- `.planning/phases/06-support-variants/06-04-SUMMARY.md`

Phase 6 now closes with library and editor family visibility, explicit create-variant actions, and family-aware detail payloads that preserve the Phase 5 media-copy boundary.

Next up: plan and execute Phase 7 guided present mode on top of the saved-task and variant-family contracts.

## Phase 7 Next

In progress on 2026-03-14. Summaries:

- `.planning/phases/07-guided-present-mode/07-01-SUMMARY.md`

Phase 7 now has the authenticated guided-present route and local session-state foundation without introducing public access or persisted tracking.

Next up: execute `07-02` to refine the dedicated present-mode layout and child-facing rendering on top of the new route boundary.
