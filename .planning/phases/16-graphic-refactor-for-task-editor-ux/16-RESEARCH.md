# Phase 16 Research

## Goal

Plan Phase 16 so the authenticated task editor becomes a cleaner, Symwriter-like operational workspace without changing the underlying saved-task, sharing, variant, session, or export capabilities.

## Requirements In Scope

- `UI-REF-01`: The editor uses a minimal top bar and removes redundant introductory/support sections from the main page.
- `UI-REF-02`: The editor separates metadata, focused step authoring, and ordered step review into a clearer workspace model.
- `UI-REF-03`: Secondary surfaces move behind a persistent action rail and centered modals while remaining fully usable on laptop and smaller screens.

## Boundaries To Preserve

Phase 16 is a presentation and workflow refactor, not a new product scope:

- keep the existing task DTOs and save semantics
- keep the explicit saved-task boundary already used by preview, present, share, and export
- keep variants, public sharing, session history, and saved-task actions functionally intact
- do not add assignment, tracking, or collaboration features in this phase
- do not replace Angular standalone-component patterns with a new UI framework

## Starting Point In This Repo

The current editor is already decomposed into useful parts:

- `task-shell-editor-entry.component.ts` owns the page shell, saved-task actions, share/session/variant surfaces, and save feedback
- `task-metadata-form.component.ts` already isolates metadata editing and can remain the top workspace block
- `task-step-authoring-editor.component.ts` already owns the step fields and visual-support editing controls

The current UX debt is mainly structural:

- too many persistent panels compete visually with authoring
- secondary operational surfaces stay open inside the main page
- step authoring still reads like an expanded stacked list instead of a focused workspace
- the top of the page repeats too much contextual copy and summary chrome

## Recommended Architecture For This Refactor

### Recommendation

Treat the editor as a workspace with four persistent layers:

1. minimal top bar
2. metadata section
3. lower two-column step workspace
4. Symwriter-like action rail

This preserves the existing editor logic while changing how it is framed and navigated.

### Why This Fits The Repo

- the current shell component already centralizes enough state to host a new layout
- Angular standalone components make it practical to split or reuse present editor fragments without broad app-shell changes
- the saved-task actions and share/session/variant surfaces are already logically separated, so they can be re-homed into modal shells without backend work
- the recent UX simplification work already moved some content toward overlays and disclosures, which reduces migration risk

## Layout Model Recommendation

### Top bar

Use a compact header containing only:

- task title or current editor identity
- save/status feedback
- a very small set of critical controls if needed

Remove:

- redundant hero copy
- workspace/support cards that explain things users are not actively doing
- broad summary strips that compete with the authoring area

### Main workspace

Recommended order:

1. `METADATA TASK`
2. lower workspace with:
   - left: focused `STEP AUTHORING`
   - right: ordered step-card board

This is preferable to a long inline list because it:

- keeps creation and review visually distinct
- avoids pushing the user into a dense stacked editing page
- makes the editor feel operational rather than form-heavy

### Step editing model

The step editor should behave like a focused editor for one step at a time.

Recommended behavior:

- creating a step adds it to the ordered board
- selecting a card loads the step into the left editor
- the left editor remains visually clean rather than showing every saved step fully expanded

## Sidebar Rail Recommendation

### Rail behavior

Use a Symwriter-style mixed rail:

- persistent on laptop/desktop
- manually toggled on smaller screens
- icon-only in default visible state

The rail can host:

- action entry points
- section-level affordances where useful

### Compact-screen behavior

Use a hamburger toggle that animates into an `X` when the rail is open.

This is the best fit for the repo because:

- it keeps the editor usable on smaller screens without forcing persistent chrome
- it avoids adding a second navigation paradigm such as a bottom sheet just for this phase
- it visually signals a stronger product shell with minimal copy

## Secondary Surface Strategy

Move these surfaces out of the persistent layout:

- saved-task actions
- public sharing
- variant family
- session history

Recommended presentation:

- rail icon click opens a centered modal
- modal supports both reading and completing the related actions
- modal remains scoped to one operational topic at a time

Why centered modal over drawer:

- the user explicitly wants modal behavior
- these surfaces are secondary to authoring
- each topic already reads like a self-contained operational surface

## Step Card Strategy

Use compact ordered cards in the right column.

Each card should emphasize:

- step position
- title
- concise support/status summary
- minimal available actions

Recommended interaction:

- on desktop, step actions appear on hover or selection
- on touch devices, those actions remain visible because hover is unavailable

Avoid:

- always-expanded rich cards
- inline full editing inside the right column
- grouped or kanban-like step organization that weakens the sequence model

## Implementation Shape In This Codebase

### Likely component changes

- `task-shell-editor-entry.component.ts`
  - becomes the host for top bar, rail, modal launch points, and lower split workspace
- `task-step-authoring-editor.component.ts`
  - likely needs to shift from repeated inline step blocks to:
    - focused single-step editor
    - selected-step loading behavior
    - dedicated step-card board rendering, either in the same component or in a sibling component
- `task-metadata-form.component.ts`
  - mostly reusable as-is, but should visually align with the new workspace hierarchy

### State management implications

The refactor can stay within the current local editor-state model:

- metadata form state remains in `TaskShellEditorEntryComponent`
- steps remain draft state owned by the editor shell
- selection of the currently edited step becomes the new key UI state
- modal open/close state can reuse the signal-based overlay pattern already present

## Validation Architecture

Phase 16 carries three main risks:

- visual hierarchy regressions
- step-authoring workflow regressions
- responsive interaction regressions for the new rail and modal surfaces

### Automated verification focus

Frontend tests should cover:

- the old heavy header/support sections are no longer rendered in the main page
- the editor renders metadata above a lower split workspace
- selecting a step card loads that step into the editor area
- rail-triggered surfaces open as centered modals rather than inline disclosures
- compact-screen rail toggle state works correctly

### Manual verification focus

Minimum manual checks:

- desktop/laptop: persistent rail feels usable and non-intrusive
- tablet/smaller viewport: hamburger animates to `X` and opens/closes the rail correctly
- author a new step, then edit an existing one from the step board
- use saved-task actions, share, variants, and session history from the new modal pattern
- verify the page still feels visually compatible with the Milo/Symwriter family

### Verification commands

- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`

## Main Pitfalls To Avoid

- preserving too much of the current page chrome and ending up with a halfway refactor
- moving surfaces into modals but leaving duplicate inline versions behind
- turning the step board into a second full editor instead of a review/select surface
- creating a desktop-only rail pattern that collapses poorly on touch devices
- introducing visual novelty that breaks Milo/Symwriter family compatibility

## Planning Recommendation

Split Phase 16 into three tracks:

1. shell and rail restructuring
2. step-authoring workspace conversion
3. modal migration, responsive polish, and regression coverage

This sequence keeps the layout foundation first, then moves the step workflow, then finishes with secondary surfaces and verification.

## Confidence

High confidence that this phase can stay frontend-only and fit inside the existing Angular architecture.

Reason:

- the editor state already lives in one place
- the main debt is structural and presentational, not domain complexity
- recent simplification work already proved this surface can move toward lighter secondary UI without changing behavior
