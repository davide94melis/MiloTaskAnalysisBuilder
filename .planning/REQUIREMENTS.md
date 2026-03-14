# Requirements: Milo Task Analysis Builder

**Defined:** 2026-03-13
**Core Value:** Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can access the application using Milo SSO without creating a separate local account.
- [x] **AUTH-02**: User session remains valid across browser refresh until logout or session expiry.
- [x] **AUTH-03**: Authenticated API requests are authorized using Milo-issued identity and app-specific access rules.

### Library

- [x] **LIBR-01**: User can create a new task analysis from scratch.
- [x] **LIBR-02**: User can view a library of their task analyses as cards showing title, step count, support level, sharing state, and last update.
- [x] **LIBR-03**: User can filter the library by category, context, target label, author, status, and support level.
- [x] **LIBR-04**: User can save a task analysis as draft and later reopen it for editing.
- [x] **LIBR-05**: User can duplicate an existing task analysis into their own space.
- [x] **LIBR-06**: User can start from at least one seed template when creating a new task analysis.

### Task Metadata

- [x] **META-01**: User can define task title, category, description, educational objective, and professional notes.
- [x] **META-02**: User can define intended target as a freeform child, group, or audience label without requiring a global Milo entity in v1.
- [x] **META-03**: User can define difficulty level, environment of use, and visibility state for a task analysis.
- [x] **META-04**: User can assign a support level profile to a task analysis.

### Step Editor

- [x] **STEP-01**: User can add, edit, reorder, duplicate, and delete steps within a task analysis.
- [x] **STEP-02**: User can define a short title and descriptive text for each step.
- [x] **STEP-03**: User can attach at least one visual support to each step, including symbol, image/photo, or text.
- [x] **STEP-04**: User can combine visual modalities on a step, including symbol plus text or photo plus text.
- [x] **STEP-05**: User can mark a step as required or optional.
- [x] **STEP-06**: User can define prompt/support guidance and optional reinforcement notes for a step.
- [x] **STEP-07**: User can define estimated time for a step.
- [x] **STEP-08**: User can save editor changes and preserve step order exactly as configured.

### Support Variants

- [x] **SUPP-01**: User can create multiple versions of the same task analysis for different support levels.
- [x] **SUPP-02**: User can duplicate an existing task analysis as the starting point for a simpler or more autonomous variant.
- [x] **SUPP-03**: User can distinguish variants through support-level metadata and visible labeling in the library and editor.

### Present Mode

- [x] **PRES-01**: User can launch a task analysis in a clean step-by-step present mode from inside the app.
- [x] **PRES-02**: Present mode displays one current step clearly with large visual content and minimal distractions.
- [x] **PRES-03**: User can move forward and backward between steps during present mode.
- [x] **PRES-04**: User can mark the current step as completed using a large low-friction action.
- [x] **PRES-05**: When the final step is completed, the app shows a clear task-completed state.
- [x] **PRES-06**: Present mode works well on tablet, phone, and desktop screen sizes.

### Sharing

- [x] **SHAR-01**: User can generate a public view link for a task analysis.
- [x] **SHAR-02**: User can generate a public interactive link that opens the task directly in present mode.
- [x] **SHAR-03**: Public links can be opened without requiring user authentication.
- [x] **SHAR-04**: Public access is limited to only the task data and assets intentionally exposed for sharing.
- [x] **SHAR-05**: User can duplicate a shared task analysis into their own authenticated space.

### Media

- [x] **MEDI-01**: User can upload or attach images/photos for task steps.
- [x] **MEDI-02**: Uploaded media is delivered reliably in both editor and present mode.
- [x] **MEDI-03**: Publicly shared tasks expose only the media required by that shared task.

### Session Tracking

- [x] **SESS-01**: When a task is completed in present mode, the app can save a minimal completion session record.
- [x] **SESS-02**: A session record stores task ID, user or access context, completion date, step count, and completed status.
- [x] **SESS-03**: Authenticated users can see at least a basic history or count of completed task sessions for their tasks.

### Export

- [x] **EXPT-01**: User can export a task analysis to printable PDF.
- [x] **EXPT-02**: Export preserves step order, text, and visual supports in a print-friendly layout.
- [x] **EXPT-03**: Export can be used for practical real-world materials rather than only on-screen viewing.

### UX Foundation

- [x] **UX-01**: The application uses a visual language compatible with Milo and Symwriter.
- [x] **UX-02**: The dashboard feels operational and reassuring rather than technical or developer-oriented.
- [x] **UX-03**: Core workflows for create, edit, present, share, and export are understandable without training-heavy UI.

## v2 Requirements

### Global Entities

- **GLOB-01**: User can reference globally shared children from the Milo ecosystem instead of only freeform target labels.
- **GLOB-02**: User can reference globally shared classes or groups from Milo Writer/Symwriter.
- **GLOB-03**: User and organizational data can be reused across Milo apps through shared global entities.

### Advanced Tracking

- **TRCK-01**: User can track per-step completion status inside each session.
- **TRCK-02**: User can record help level used for each step during execution.
- **TRCK-03**: User can record per-step timing and professional notes.
- **TRCK-04**: User can review longitudinal session history and step-level patterns.

### Collaboration

- **COLL-01**: Teams can work in shared workspaces with role-based permissions.
- **COLL-02**: Teams can maintain shared task libraries across staff members.
- **COLL-03**: Tasks can be assigned to specific children or groups with role-appropriate access for family and school.

### Automation And Intelligence

- **AUTO-01**: User can generate task variants automatically from an existing task analysis.
- **AUTO-02**: User can generate or refine text simplifications automatically.
- **AUTO-03**: User can use QR codes for distribution and execution access.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-step clinical tracking in v1 | Too much workflow and data-model complexity before validating core usage |
| Workspace roles and team collaboration in v1 | Requires broader permissions, billing, and ownership model |
| Student assignment model in v1 | Pushes the product toward case management instead of validating the task-analysis workflow |
| Marketplace/community template discovery in v1 | Distribution can wait until creation and duplication are proven |
| AI-generated variants in v1 | Interesting differentiator, but not required to validate the core product |
| Native mobile apps in v1 | Web-first product with strong responsive present mode is sufficient initially |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| LIBR-01 | Phase 2 | Complete |
| LIBR-02 | Phase 2 | Complete |
| LIBR-03 | Phase 2 | Complete |
| LIBR-04 | Phase 2 | Complete |
| LIBR-05 | Phase 2 | Complete |
| LIBR-06 | Phase 2 | Complete |
| META-01 | Phase 3 | Complete |
| META-02 | Phase 3 | Complete |
| META-03 | Phase 3 | Complete |
| META-04 | Phase 3 | Complete |
| STEP-01 | Phase 4 | Complete |
| STEP-02 | Phase 4 | Complete |
| STEP-03 | Phase 5 | Complete |
| STEP-04 | Phase 5 | Complete |
| STEP-05 | Phase 4 | Complete |
| STEP-06 | Phase 4 | Complete |
| STEP-07 | Phase 4 | Complete |
| STEP-08 | Phase 3 | Complete |
| SUPP-01 | Phase 6 | Complete |
| SUPP-02 | Phase 6 | Complete |
| SUPP-03 | Phase 6 | Complete |
| PRES-01 | Phase 7 | Complete |
| PRES-02 | Phase 7 | Complete |
| PRES-03 | Phase 7 | Complete |
| PRES-04 | Phase 7 | Complete |
| PRES-05 | Phase 7 | Complete |
| PRES-06 | Phase 7 | Complete |
| SHAR-01 | Phase 8 | Complete |
| SHAR-02 | Phase 8 | Complete |
| SHAR-03 | Phase 8 | Complete |
| SHAR-04 | Phase 8 | Complete |
| SHAR-05 | Phase 8 | Complete |
| MEDI-01 | Phase 5 | Complete |
| MEDI-02 | Phase 5 | Complete |
| MEDI-03 | Phase 8 | Complete |
| SESS-01 | Phase 9 | Complete |
| SESS-02 | Phase 9 | Complete |
| SESS-03 | Phase 9 | Complete |
| EXPT-01 | Phase 10 | Complete |
| EXPT-02 | Phase 10 | Complete |
| EXPT-03 | Phase 10 | Complete |
| UX-01 | Phase 10 | Complete |
| UX-02 | Phase 2 | Complete |
| UX-03 | Phase 10 | Complete |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-14 after Phase 9 completion*
