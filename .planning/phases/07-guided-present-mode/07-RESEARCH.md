# Phase 07 Research

## Goal

Plan Phase 7 so authenticated users can launch a saved task into a clean guided present-mode flow that shows one step at a time, supports low-friction forward/back/complete interactions, ends in a clear completion state, and remains usable on phone, tablet, and desktop without changing the existing saved-task/media contract.

## Requirements In Scope

- `PRES-01`: launch a task analysis in a clean step-by-step present mode from inside the app
- `PRES-02`: show one current step clearly with large visual content and minimal distractions
- `PRES-03`: move forward and backward between steps during present mode
- `PRES-04`: mark the current step as completed using a large low-friction action
- `PRES-05`: show a clear task-completed state when the final step is completed
- `PRES-06`: work well on tablet, phone, and desktop

## Boundaries To Preserve

Phase 7 should extend the existing authenticated playback proof, not reopen earlier decisions:

- authenticated app only; no public or anonymous present-mode access
- current preview proof is reusable input, not the finished Phase 7 UX
- public sharing and share-safe media exposure remain Phase 8
- minimal completion/session persistence remains Phase 9
- media fidelity from Phase 5 must carry into present mode exactly as saved
- support variants from Phase 6 remain copy-based families; present mode should launch the currently opened task/variant, not introduce family playback logic

## Starting Point From Phases 5 And 6

The repo already has the right data boundary for present mode:

- `/tasks/:taskId/preview` is an authenticated, read-only playback proof outside the editor
- the preview fetches fresh saved task detail through `TaskLibraryService.getTaskDetail(taskId)`
- preview rendering already uses the persisted `visualSupport` contract and authenticated media URLs
- preview launch is intentionally save-aware and blocked while draft media is still pending persistence
- `GET /api/tasks/{taskId}` already returns everything present mode needs for v1 step playback:
  - task metadata
  - ordered steps
  - `required`
  - `supportGuidance`
  - `reinforcementNotes`
  - `estimatedMinutes`
  - nested `visualSupport.text`, `visualSupport.symbol`, and `visualSupport.image`
- Phase 6 variant metadata is already present in the same task detail payload, so present mode can launch any current variant without extra backend work

What is still missing:

- no dedicated guided-present route
- no completion action or completed-task state
- no explicit local session model beyond a current index
- no phone/tablet-focused child-facing layout beyond the narrow preview proof
- no automated coverage for completion flow, empty-step behavior, or responsive usability

## Current Codebase Entry Points And Reusable Surfaces

### Frontend entry points

- `frontend/src/app/app.routes.ts`
  - current authenticated route is `/tasks/:taskId/preview`
  - this is the obvious seed for a new Phase 7 route such as `/tasks/:taskId/present`
- `frontend/src/app/features/library/task-shell-editor-entry.component.ts`
  - current editor action panel already contains the launch affordance pattern
  - `openPreview()` and `canOpenPreview()` already encode the saved-only rule that present mode should likely keep in Phase 7
- `frontend/src/app/features/present/task-playback-preview-page.component.ts`
  - already loads route params, fetches task detail, sorts steps by position, and renders one step at a time
  - already proves the right source of truth: saved task detail, not in-memory draft state
  - already has child-facing tendencies such as one-step focus and large visual support treatment

### Frontend reusable patterns

- signals for local UI/session state are already used and are sufficient for Phase 7 local progress state
- `firstValueFrom(this.taskLibrary.getTaskDetail(taskId))` is the current route-load pattern
- current preview navigation methods (`showPreviousStep`, `showNextStep`) are directly reusable as the base step-flow controller
- `hasSavedVisualSupport(step)` is a useful present-mode rendering helper
- existing editor tests already prove the launch boundary should respect saved media persistence

### Backend reusable surfaces

- `backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java`
  - `getTaskDetail(...)` already assembles the complete authenticated playback payload
  - ownership checks are already enforced through the existing task-detail flow
  - no separate present-mode endpoint is required for Phase 7 unless planner wants a narrower DTO for future optimization
- `backend/src/main/java/com/milo/taskbuilder/task/dto/TaskDetailResponse.java`
  - already exposes the step and media fields needed for guided playback
  - already carries family metadata if the launched task is a variant
- `backend/src/test/java/com/milo/taskbuilder/task/TaskDetailControllerIntegrationTest.java`
  - already protects the contract that present mode will consume
  - good place to add contract coverage only if Phase 7 changes the task-detail shape, which it probably should not

## Backend / Frontend Contract Guidance

### What Phase 7 likely does not need

The current `GET /api/tasks/{taskId}` contract is already sufficient for v1 guided present mode if Phase 7 keeps progress local to the browser session:

- one-step display can use existing ordered `steps`
- large visual rendering can use existing `visualSupport`
- forward/back navigation needs no new server state
- completion action can remain purely client-side in Phase 7
- final completed screen can be derived locally when the last step is completed

That is the cleanest interpretation of the roadmap boundary between Phase 7 and Phase 9.

### What Phase 7 must not do to the contract

- do not add public asset URLs
- do not add public/share tokens
- do not persist completion/session rows
- do not introduce a second playback-specific media model
- do not make present mode depend on editor-local upload state

### Optional but non-essential backend change

Only consider a dedicated present-mode backend DTO if one of these becomes compelling during planning:

- the team wants to explicitly hide editor/professional metadata from the present route
- the current detail payload becomes too editor-shaped to safely reuse
- performance becomes a real problem after implementation evidence, not before

Absent that, reusing the existing task-detail contract is the lower-risk plan.

## Recommended Product And UX Decisions For Planning

### 1. Create a distinct present-mode route, not an in-place preview rewrite

The Phase 5 preview is intentionally labeled as verification-only. Phase 7 should add a new dedicated route and component instead of mutating the preview proof into the final UX. Recommended shape:

- keep `/tasks/:taskId/preview` as the narrow proof surface
- add `/tasks/:taskId/present` as the real guided session surface
- launch Phase 7 present mode from the editor and likely from library cards later if desired, but do not require library expansion if the plan needs to stay tight

This preserves the verified proof surface and avoids rewriting tests and docs that intentionally describe preview as not-present-mode.

### 2. Keep progress local-only in Phase 7

Use a local present-session view model:

- `currentStepIndex`
- `completedStepIds` or `completedStepIndexes`
- derived flags:
  - `isFirstStep`
  - `isLastStep`
  - `isCurrentStepCompleted`
  - `isSessionComplete`

This satisfies `PRES-03`, `PRES-04`, and `PRES-05` without collapsing into Phase 9 session persistence.

### 3. Treat “complete current step” as UI progress, not clinical data

The completion action should likely:

- mark the current step complete locally
- advance to the next step automatically or offer an immediate next-step action
- keep backward navigation available
- make the final completion state obvious and calm

Do not record:

- timestamps
- help level
- per-step notes
- who completed it
- saved history counts

Those are Phase 9 or v2 concerns.

### 4. Reduce visible chrome sharply compared with preview

The current preview includes verification copy, summary metadata blocks, notes, and editor-oriented framing. For `PRES-02`, Phase 7 should decide explicitly which content is child-facing and which is adult/support-facing.

Recommended default:

- always show:
  - task title
  - step number / total
  - current step title
  - current step descriptive text
  - large visual support content
  - large back / next / complete controls
- show sparingly or collapse:
  - support guidance
  - reinforcement notes
  - estimated minutes
  - target/context/support-level metadata

The planner should choose one of two patterns and stay consistent:

- adult-assisted present mode: show prompt/guidance in a secondary panel
- child-facing present mode: hide most professional metadata by default and keep only the core step content

Either choice is valid, but the plan should decide explicitly rather than carrying preview content forward by accident.

### 5. Preserve the saved-only launch rule

The current preview launch blocks while media is pending persistence. Present mode should keep the same rule in Phase 7:

- launch only from saved task detail
- never merge unsaved draft upload state into playback
- keep the editor message clear that present mode shows the last saved version

This protects Phase 5’s media reliability boundary.

## Responsive UX Constraints

Phase 7 has a real responsive requirement and the current preview is only partially ready.

Known constraints from current code:

- current breakpoint logic only collapses to one column below `860px`
- current preview still uses multi-panel layouts that may crowd smaller screens
- image area uses `max-height: 20rem`, which may underuse large tablets and overconstrain phone layouts
- current tests do not cover touch-target size, mobile stacking, or keyboard navigation

Planning implications:

- present mode should be designed mobile-first, not desktop-first with a late collapse
- the primary action should be thumb-friendly and visually dominant
- back/next/complete controls need large hit areas and predictable placement
- the route should avoid long scrolling caused by too many metadata blocks
- image/text/symbol combinations need to remain legible in portrait tablet and narrow phone widths
- the completion state must still feel intentional on small screens, not like a leftover empty page

Recommended UX guardrails for planning:

- one main content column on phone and tablet
- a single primary action at a time
- secondary actions remain available but visually subordinate
- maintain large contrast-safe typography and large visual-support rendering
- avoid requiring fine motor precision for navigation or completion controls

## Edge Cases The Plan Should Handle Explicitly

- task has zero steps
  - decide whether present mode is blocked with an explanatory empty state or opened with a “no steps to present” message
- task has one step only
  - completion flow should be obvious and not depend on “next step”
- step has text-only support
- step has symbol-only support
- step has image-only support
- step has mixed visual support
- step lacks optional fields like support guidance, reinforcement notes, or estimated minutes
- task is a variant
  - present the current variant only; no family-switching flow is required in-session
- route load fails
  - keep a clean recoverable error state similar to preview

## Risks To Plan Around

- reusing the preview component directly and inheriting verification copy, summary panels, and notes that violate `PRES-02`
- accidentally introducing persistence for completion state and thereby pulling Phase 9 forward
- expanding backend scope with a new present endpoint even though the current detail contract already fits
- regressing the save boundary by letting unsaved draft media appear in present mode
- making the responsive layout “technically stacked” but still too dense for tablets and phones
- forgetting the zero-step or one-step paths and discovering late that completion logic assumes multi-step tasks
- surfacing support-variant family controls during present mode and turning session UI back into management UI
- allowing professional metadata to dominate the child-facing step content

## Suggested Plan Decomposition

Use 4 plans in 3 waves.

### Wave 1

1. Present-mode route and session-state foundation
   - add a dedicated authenticated present-mode route
   - create a distinct present-mode component instead of mutating preview
   - load saved task detail and establish local session state for current/completed steps
   - define empty/error/loading states

### Wave 2

2. Child-facing step rendering and responsive layout
   - build the simplified one-step presentation surface
   - render mixed visual supports from the existing saved contract
   - define responsive behavior for phone, tablet, and desktop
   - decide how support guidance / notes appear without overwhelming the layout

3. Guided controls and completion flow
   - add back / next navigation
   - add prominent complete-current-step action
   - derive final completion state when the last step is completed
   - preserve backward navigation and clear session feedback

### Wave 3

4. Launch integration, regression protection, and docs
   - add explicit launch action from the editor for the new present route
   - keep preview action intact if both routes coexist
   - add tests for saved-only launch, local completion flow, and completion state
   - update docs so preview remains proof-only while present mode becomes the real authenticated playback experience

## Verification Strategy

Phase 7 should lean heavily on frontend behavior tests because most new behavior is local UI state, not backend logic.

### Automated verification layers

1. Frontend route and launch tests
   - present route is registered under the authenticated shell
   - editor can launch present mode for saved tasks
   - launch remains blocked or clearly constrained when draft media is pending persistence

2. Present component tests
   - loads task detail from the saved contract
   - renders text, symbol, image, and mixed-support steps correctly
   - shows one current step at a time
   - back and next behavior works across first, middle, and last steps
   - completing the current step updates local state correctly
   - final step completion shows the completed-task state
   - zero-step and load-error states are handled cleanly

3. Frontend service tests
   - existing `getTaskDetail` contract coverage remains intact
   - add route-usage coverage only if the service surface changes, which it likely should not

4. Backend contract tests
   - only needed if the task-detail payload changes
   - otherwise existing controller integration coverage should continue to protect the playback payload

### Manual verification checklist

- open a saved task with mixed visual supports in present mode from the authenticated app
- verify the route uses the last saved version, not draft-only changes
- navigate forward and backward across several steps on desktop
- repeat on tablet-width and phone-width layouts
- complete the current step using the large primary action
- complete the final step and confirm the completed state is clear
- open a one-step task and verify completion still works cleanly
- open an empty task and verify the route fails gracefully without broken controls
- open a saved variant task and confirm present mode reflects that variant’s content without exposing family-management UI

### Verification commands

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`

## Nyquist-Style Validation Notes

The highest-risk validation gap is not backend correctness; it is UX-state correctness across multiple permutations of saved content and device width. For Phase 7, the Nyquist-style coverage should focus on crossing the important axes rather than just testing one happy path.

Recommended matrix:

- step count: `0`, `1`, `many`
- support type: `text`, `symbol`, `image`, `mixed`
- device class: `phone`, `tablet`, `desktop`
- session position: `first`, `middle`, `last`, `completed`

At minimum, automated tests plus manual checks should ensure each axis is exercised somewhere. The planner does not need full Cartesian explosion, but should avoid proving only “many mixed steps on desktop”.

## What Must Stay Out Of Scope In Phase 7

- public links or anonymous present-mode access
- share-safe authorization or public media URLs
- saved session/completion records
- history views, completion counts, or reporting
- per-step clinical tracking, timing capture, or notes capture
- family-switching controls inside the live session
- variant comparison or version-history behavior
- export/print behavior
- broad UX-polish work that belongs to Phase 10

## Planning Recommendation

Plan Phase 7 as a frontend-heavy phase that reuses the existing authenticated task-detail/media contract and introduces a distinct local-state present-mode route. The safest plan is to keep backend changes minimal or zero, preserve the saved-only launch rule from preview, and spend the implementation budget on responsive step rendering, low-friction completion flow, and verification of edge cases that the current preview proof does not cover.
