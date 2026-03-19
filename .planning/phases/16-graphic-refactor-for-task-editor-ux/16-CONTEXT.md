# Phase 16: Graphic Refactor for Task Editor UX - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor the authenticated task editor experience so it feels closer to a Symwriter-like operational workspace, with cleaner hierarchy, lighter persistent chrome, and a more focused step-authoring flow. This phase changes how the editor is presented and navigated, without adding new product capabilities beyond the existing task-editing, sharing, variant, session, and saved-surface flows.

</domain>

<decisions>
## Implementation Decisions

### Page hierarchy
- Remove the current always-visible introductory blocks equivalent to `WORKSPACE OPERATIVO`, `EDITOR METADATA TASK`, `SUPPORTO RAPIDO`, and `STATO EDITOR`.
- Replace the heavy top section with a minimal top bar that shows only the essentials such as task identity, save/state feedback, and a small set of critical controls.
- Keep `METADATA TASK` as the first main workspace section at the top of the editor.
- Below metadata, split the workspace into two columns:
  - left column for `STEP AUTHORING`
  - right column for an ordered board of created-step cards

### Step authoring workflow
- The left `STEP AUTHORING` area should stay clean and focused on creating or editing one step at a time.
- When a step is created, it belongs in the right-hand step board rather than remaining expanded inline in a long page list.
- Clicking a step card loads that step back into the left authoring area for editing.
- The right column remains sequence-oriented, not grouped by status or type.

### Sidebar and secondary panels
- Introduce a Symwriter-style sidebar rail that is always visible on laptop/desktop layouts.
- On smaller screens, the sidebar opens manually rather than remaining always visible.
- The mobile/small-screen toggle should be a hamburger button with an animation that transforms into an `X` when open.
- The sidebar should be icon-only in its default visible state.
- The sidebar should behave as a mixed rail: it can host both navigation affordances and operational actions.

### Secondary surfaces
- `Storico sessioni`, `Condivisione pubblica`, `Famiglia varianti`, and `Azioni task salvata` should move out of the persistent page layout.
- These surfaces should be opened by clicking icons in the sidebar.
- Each of those surfaces should open in a centered modal, not inline on the page and not in a drawer.
- These modals should support both inspection and full action handling, so users can complete the related tasks without returning to a dedicated persistent panel.

### Step board behavior
- Step cards in the right column should use a compact-summary style rather than rich always-expanded cards.
- Step actions such as reorder, duplicate, and delete should appear on hover or selection in desktop contexts.
- On touch devices without hover, step actions should remain visible.

### Claude's Discretion
- Exact iconography for the sidebar rail
- Specific animation timing and motion details for the hamburger-to-`X` transition
- Exact breakpoint values for when the rail becomes collapsible
- Final spacing, border treatment, and card styling inside the new layout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/app/features/library/task-shell-editor-entry.component.ts`: already centralizes editor shell layout, save surfaces, share/session/variant panels, and support overlay behavior. This is the main integration point for the new workspace structure.
- `frontend/src/app/features/library/task-metadata-form.component.ts`: already isolates the metadata form and can be reused as the top section of the new layout.
- `frontend/src/app/features/library/task-step-authoring-editor.component.ts`: already contains the editable step fields, visual-support controls, and step actions that can be reoriented into a left-side authoring panel.

### Established Patterns
- The editor currently uses standalone Angular components with local styles and component-level layout ownership.
- The current refactor direction already introduced disclosures and contextual overlays rather than permanently visible help copy.
- Task editing is still modeled as a single-page editor shell that coordinates metadata form state and step draft state.

### Integration Points
- `TaskShellEditorEntryComponent` should become the host for the new top bar, sidebar rail, modal launch points, and two-column step workspace.
- `TaskStepAuthoringEditorComponent` will likely need to evolve from inline repeated-step editing into a focused single-step editor plus separate step-board presentation.
- Existing share/session/variant/task-action logic should be preserved functionally and re-homed into icon-launched modals instead of persistent sidebar disclosures.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly wants the editor to behave more like Symwriter on larger screens.
- The desired layout is:
  - metadata section on top
  - step authoring panel on the lower left
  - created-step card board on the lower right
- The authoring area should remain visually clean rather than turning into a long stacked list of expanded step cards.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within the editor refactor boundary.

</deferred>

---

*Phase: 16-graphic-refactor-for-task-editor-ux*
*Context gathered: 2026-03-19*
