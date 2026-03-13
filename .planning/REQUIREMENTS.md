# Milo Task Analysis Builder Requirements

## v1 Requirements

### Authentication & Access

- [ ] **AUTH-01**: User can sign in to the app using Milo SSO without creating a separate local account.
- [ ] **AUTH-02**: Authenticated user can access a personal workspace scoped to this app after Milo sign-in.
- [ ] **AUTH-03**: Public visitor can open a shared task link in allowed mode without needing an account.

### Dashboard & Library

- [ ] **LIB-01**: User can view a dashboard with recent tasks, draft tasks, and ready-to-use templates.
- [ ] **LIB-02**: User can browse all task analyses in a central library.
- [ ] **LIB-03**: User can filter the library by category, author, support level, visibility, and last update.
- [ ] **LIB-04**: User can open an existing task from the library to edit, play, export, or share it.

### Task Model & Metadata

- [ ] **TASK-01**: User can create a new task analysis with title, category, description, educational objective, environment, and support level.
- [ ] **TASK-02**: User can save a task as draft and continue editing later.
- [ ] **TASK-03**: User can mark a task as private or shareable.
- [ ] **TASK-04**: User can duplicate an existing task into their own workspace.

### Step Editor

- [ ] **STEP-01**: User can add, edit, and delete ordered steps within a task analysis.
- [ ] **STEP-02**: User can reorder steps with drag and drop.
- [ ] **STEP-03**: User can define for each step a short title and descriptive text.
- [ ] **STEP-04**: User can attach at least one visual support to a step using symbol, image/photo, or both.
- [ ] **STEP-05**: User can set optional step properties including prompt/support text, optional reinforcement text, estimated time, and required/optional flag.
- [ ] **STEP-06**: User can duplicate a step inside the same task.
- [ ] **STEP-07**: User can start from a template task and adapt its steps.

### Support Level & Variants

- [ ] **SUP-01**: User can assign a support level to a task analysis using predefined levels such as total support, gestural/verbal/visual support, or autonomy.
- [ ] **SUP-02**: User can create a variant of an existing task analysis to adapt the same routine to a different support level.

### Present Mode

- [ ] **PLAY-01**: User can launch a task in a dedicated present mode from the authenticated app.
- [ ] **PLAY-02**: Present mode shows one clear step at a time with large visual content and minimal distractions.
- [ ] **PLAY-03**: User can move forward and backward between steps in present mode.
- [ ] **PLAY-04**: User can mark the current step as completed with a prominent action.
- [ ] **PLAY-05**: Present mode works on desktop, tablet, and mobile layouts.
- [ ] **PLAY-06**: At the end of the task, the app shows a completion state for the session.

### Sharing & Public Access

- [ ] **SHARE-01**: User can generate a public view link for a task analysis.
- [ ] **SHARE-02**: User can generate an interactive public link that opens the task directly in present mode.
- [ ] **SHARE-03**: Shared public links expose only the task data needed for viewing or playback and not private editing data.
- [ ] **SHARE-04**: Authenticated recipient can duplicate a shared task into their own workspace.

### Session Tracking

- [ ] **TRACK-01**: When a task is completed in present mode, the app can record a minimal session entry with task, completion date, step count, and completion status.
- [ ] **TRACK-02**: Authenticated user can see basic usage evidence for a task, such as completion count or recent sessions.

### Export

- [ ] **EXP-01**: User can export a task analysis as a printable PDF.
- [ ] **EXP-02**: Exported PDF preserves step order and associated visual supports in a readable print layout.

### Visual Consistency

- [ ] **UI-01**: The app uses a visual language compatible with Symwriter and Milo, including soft surfaces, clear cards, controlled gradients, and reassuring operational UX.
- [ ] **UI-02**: Present mode keeps the same ecosystem identity while optimizing readability and large touch targets.

## v2 Requirements

- [ ] **TRACK-03**: User can record per-step outcomes, prompt level, time, and notes for each session.
- [ ] **TEAM-01**: Team can share a common workspace with shared libraries and role-based permissions.
- [ ] **TEAM-02**: User can share tasks internally across organization members without public links.
- [ ] **GLOBAL-01**: App can reuse global entities from Milo Writer, including children, classes, and other shared ecosystem records.
- [ ] **AUDIO-01**: User can record or upload audio instructions per step.
- [ ] **QR-01**: User can generate QR codes for shared tasks.
- [ ] **VAR-01**: App can suggest or generate simplified and advanced variants of a task automatically.
- [ ] **TPL-01**: User can access a richer template library with public/shared starter routines.

## Out Of Scope

- Marketplace or public community template exchange in V1 - defer until duplication and basic sharing are validated.
- Full student assignment workflows in V1 - defer until global Milo entities are integrated.
- Advanced analytics and reporting dashboards in V1 - defer until session data is richer.
- PEI/goal-plan integrations in V1 - defer until the product proves its standalone value.
- AI-generated tasks in V1 - defer until the manual workflow is stable.

## Traceability

| Requirement ID | Planned Phase |
|----------------|---------------|
| AUTH-01 | - |
| AUTH-02 | - |
| AUTH-03 | - |
| LIB-01 | - |
| LIB-02 | - |
| LIB-03 | - |
| LIB-04 | - |
| TASK-01 | - |
| TASK-02 | - |
| TASK-03 | - |
| TASK-04 | - |
| STEP-01 | - |
| STEP-02 | - |
| STEP-03 | - |
| STEP-04 | - |
| STEP-05 | - |
| STEP-06 | - |
| STEP-07 | - |
| SUP-01 | - |
| SUP-02 | - |
| PLAY-01 | - |
| PLAY-02 | - |
| PLAY-03 | - |
| PLAY-04 | - |
| PLAY-05 | - |
| PLAY-06 | - |
| SHARE-01 | - |
| SHARE-02 | - |
| SHARE-03 | - |
| SHARE-04 | - |
| TRACK-01 | - |
| TRACK-02 | - |
| EXP-01 | - |
| EXP-02 | - |
| UI-01 | - |
| UI-02 | - |
