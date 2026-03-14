# Phase 10 Research

## Goal

Plan Phase 10 so v1 can produce practical printable task materials and close the most visible Milo/Symwriter UX gaps without reopening core persistence, sharing, or session-tracking boundaries late in the milestone.

## Requirements In Scope

- `EXPT-01`: User can export a task analysis to printable PDF.
- `EXPT-02`: Export preserves step order, text, and visual supports in a print-friendly layout.
- `EXPT-03`: Export can be used for practical real-world materials rather than only on-screen viewing.
- `UX-01`: The application uses a visual language compatible with Milo and Symwriter.
- `UX-03`: Core workflows for create, edit, present, share, and export are understandable without training-heavy UI.

## Boundaries To Preserve

Phase 10 should finish the MVP, not reopen earlier phase design:

- keep the explicit saved-task boundary from Phases 3 through 8
- reuse existing `GET /api/tasks/{taskId}` and public share DTOs instead of inventing a second task model
- do not introduce per-step analytics, reporting, or new session detail
- do not rebuild sharing, present mode, or variant families
- do not require a heavy new PDF service, worker, or headless browser pipeline for v1
- do not turn export into screenshot capture; printed output must remain structured and selectable

## Starting Point In This Repo

The repo is in a good position for a narrow export phase:

- Angular already owns the best rendering of saved task content across editor, preview, present, and shared view
- `frontend/package.json` has no PDF/export dependency today, which is a signal to prefer the smallest possible addition
- the saved task model already contains the content needed for print:
  - task title and metadata
  - ordered steps with `position`
  - `visualSupport.text`
  - `visualSupport.symbol`
  - `visualSupport.image`
  - optional adult guidance fields
- editor, preview, present, and public share surfaces already enforce the rule that only saved content is shown outside active authoring

Current UX state is usable but still fragmented:

- dashboard and library feel operational, but primary actions and labels are not fully normalized
- editor has many side-panel actions and explanatory copy blocks competing for attention
- variant creation still uses `window.prompt`, which feels tool-like rather than Milo-like
- present and shared view have strong direction, but they do not yet anchor a print/export flow
- there is no obvious export entry point anywhere

## Recommended V1 Export Architecture

### Recommendation

Use a frontend-owned print route with browser PDF generation as the v1 export architecture.

Concretely:

- add a dedicated authenticated route such as `/tasks/:taskId/export`
- load the same saved task detail DTO already used by preview/present
- render a print-specific document component with screen preview plus `@media print` rules
- provide one clear CTA from the editor: `Esporta PDF`
- trigger `window.print()` from the export page after content is loaded, with a visible fallback button

This is the smallest credible approach because it:

- reuses the Angular rendering stack already proven in this repo
- preserves selectable text, real image elements, and DOM order
- avoids late backend PDF infrastructure work
- avoids screenshot/canvas quality problems
- maps directly to how many education/therapy teams already create printable PDFs from browser flows

### Why This Fits This Codebase

- export is a presentation concern over already-saved data, not a new domain workflow
- the backend currently exposes the right content but no document-generation stack
- the frontend already has separate owner and public-safe read models, so it can build print views without changing persistence
- v1 success is print-ready output, not a multi-template publishing engine

## Export Strategy Tradeoffs For This Repo

### Frontend-generated print/PDF

Recommended for v1.

Pros:

- no new backend runtime dependency
- no headless Chromium or PDF library setup on Render
- easiest way to keep layout aligned with existing Angular UI language
- image URLs and mixed visual supports already render correctly in the browser
- fastest path to a stable MVP export

Cons:

- final PDF fidelity depends somewhat on browser print engines
- pagination needs careful CSS testing
- auto-download of a binary PDF is weaker than a server-generated file

### Backend-generated PDF

Not recommended for v1.

Pros:

- more deterministic file output
- easier future path to stored exports, email delivery, or template variants

Cons for this repo:

- would add a new document-generation stack to the Java backend very late
- likely requires HTML-to-PDF or PDF layout libraries plus font/image handling
- duplicates presentation logic now living in Angular
- increases deployment and verification scope across Render

### Hybrid HTML + backend PDF

Reasonable only as a later evolution.

Pros:

- lets Angular or shared templates define layout while backend renders the final PDF

Cons:

- still adds late cross-stack complexity
- requires keeping print markup stable across two render paths
- too much integration risk for the final v1 phase

### Decision

For Phase 10, treat export as:

- a print-optimized Angular document route
- backed by existing saved DTOs
- using the browser print dialog as the PDF generator

Defer true backend PDF generation until there is a product need for deterministic downloadable files or batch export.

## Printable Layout Model

The printable layout should be constrained and boring in the right places. v1 should optimize for usability in classrooms and therapy settings, not visual cleverness.

### Page model

- default to A4 portrait
- support browser fallback to US Letter without breaking content
- use generous margins and high contrast
- avoid full-bleed designs and large decorative backgrounds in print

### Document structure

Recommended order:

1. Task cover/header
2. Core metadata strip
3. Ordered step cards
4. Optional facilitator notes section

### Header block

Include:

- task title
- category
- target label only if it is already considered safe/expected in owner export
- support level
- environment/context
- last updated date
- optional short description

Do not overfill the first page with editor-only metadata.

### Step card rules

Each step should preserve exact saved order and use a repeatable structure:

- step number
- step title
- short description
- visual support area
- small footer for required/optional and estimated time

### Visual support rules

- keep visual support order consistent: text, symbol, image
- allow any subset of the three modalities
- never rasterize text into an image
- render symbols as text labels in v1 if there is no true printable Symwriter asset pipeline
- keep image aspect ratio with `object-fit: contain`
- cap image height so one oversized photo does not consume a full page

### Pagination rules

- avoid breaking a single step card across pages where possible
- if a step is too tall, allow only the image area to continue, not the title/meta split from the rest
- keep header + first step together when possible
- repeat nothing except browser-standard page header/footer settings

### Practicality constraints

To satisfy `EXPT-03`, the print view should:

- remain legible in grayscale
- preserve enough white space for laminating/printing use
- avoid tiny metadata labels
- keep step numbering visually dominant
- avoid depending on hover, tabs, drawers, or collapsible UI

## Concrete UX Polish Targets

### 1. Main layout and navigation

Polish target:

- make the app shell feel more like a product family surface and less like a scaffold

Recommended changes:

- standardize primary CTA labels across dashboard, library, and editor
- add a clearer active-page title/section cue in the shell
- keep the existing soft palette, rounded surfaces, and reassuring tone, but tighten spacing and hierarchy

### 2. Dashboard

Polish target:

- make the first action obvious in under 5 seconds

Recommended changes:

- strengthen the primary path between `Nuova task`, recent drafts, and templates
- reduce copy density in the hero
- add one short explanation that task work can continue in editor, present, share, or export from the saved task

### 3. Library and task cards

Polish target:

- improve scan speed and reduce decision friction

Recommended changes:

- normalize action labels for open/duplicate/variant
- make support level and family role easier to distinguish visually
- ensure card metadata order matches real decision priority: support level, title, target/context, updated date

### 4. Editor

This is the highest-value polish surface.

Polish target:

- make save, preview, present, share, sessions, variants, and export feel like one coherent workflow

Recommended changes:

- add `Esporta PDF` to the existing action panel beside preview/present
- regroup side panels into clearer sections:
  - save/playback
  - export/share
  - sessions
  - variants
- reduce repeated explanatory copy so users do not need to reread the same saved-boundary rule
- replace `window.prompt` variant creation with an inline modal or compact form
- ensure export is visibly saved-state based, exactly like preview and sharing

### 5. Present mode and preview

Polish target:

- make them feel clearly related but not redundant

Recommended changes:

- position preview as verification/readback
- position present mode as child-facing execution
- keep visual language aligned between preview, present, and export so users learn one content structure

### 6. Shared view

Polish target:

- keep the shared page safe and simple

Recommended changes:

- preserve the current public-safe content boundary
- improve action emphasis for duplicate vs read-only view
- do not add complex export controls here in v1 unless a public print path is explicitly required

### 7. Export entry point

Polish target:

- make export discoverable without teaching

Recommended changes:

- primary export entry: editor action panel
- optional secondary entry: preview page
- avoid placing first export access only in dashboard or library

## Recommended Phase Scope

Phase 10 should probably split into three tracks:

1. Print/export route and CSS document model
2. Editor/export entry points plus saved-state messaging
3. Cross-surface UX polish pass on dashboard, library, editor, present, and shared view

Keep out of scope:

- downloadable archived PDF files stored in backend/storage
- multiple print templates
- branded institution headers/footers
- QR code generation
- public anonymous export unless planning decides it is essential
- deep information architecture rewrite

## Validation Architecture

Phase 10 has two main risk dimensions:

- export fidelity
- UX coherence across existing surfaces

### Export validation matrix

Minimum cases:

- text-only steps
- symbol-only steps
- image-only steps
- mixed text + symbol + image steps
- long task titles and long descriptions
- tasks with many steps
- tasks with missing optional metadata

Validate:

- order is preserved exactly
- text remains selectable in the printed PDF
- images load in print preview
- no step silently disappears at a page break
- print output works in both A4 and US Letter reasonably

### UX validation matrix

Minimum workflow coverage:

- create -> save -> export
- create -> save -> preview -> present
- create -> save -> share -> open public view
- open existing task -> duplicate -> variant -> export

Check:

- user can find the next action without hidden controls
- action labels stay consistent between pages
- save-boundary language is consistent across preview/share/export
- export is understandable as a saved-content action, not a draft action

### Automated verification

Frontend tests should cover:

- export page renders ordered saved steps from `getTaskDetail`
- export CTA is present on the editor and disabled only under the same saved/draft constraints already used by preview/share where applicable
- print view handles empty visual-support combinations cleanly
- key workflow labels remain present after the UX pass

### Manual verification

- export a task with mixed supports using browser print to PDF
- print-preview a long multi-page task
- confirm the same saved task content appears consistently in preview, present, shared view, and export
- verify export remains usable on common desktop browsers before calling Phase 10 done

### Verification commands

- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`

## Main Pitfalls To Avoid

- using canvas/screenshot PDF generation and losing text quality or pagination control
- adding a backend PDF stack that becomes Phase 10's main risk instead of the export experience itself
- letting export render unsaved draft media or unsaved reordered steps
- over-polishing visuals while leaving action hierarchy confusing
- turning the editor into an even denser control wall
- introducing public export scope accidentally through shared routes without an explicit decision

## Planning Recommendation

Plan Phase 10 as a narrow finish phase:

- implement export as a dedicated Angular print route over saved task data
- use browser print as the v1 PDF mechanism
- keep the print layout structured, high-contrast, and page-break aware
- add export where users already manage saved playback and sharing
- focus UX polish on action clarity, hierarchy, and Milo/Symwriter consistency, not on a redesign

## Confidence

High confidence on the export architecture recommendation.

Reason:

- it matches the current Angular-heavy presentation layer
- it avoids adding the largest late-stage technical risk
- it satisfies the requirement with the smallest credible implementation surface
