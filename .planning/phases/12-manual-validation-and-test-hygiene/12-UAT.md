# Phase 12 UAT

status: partial
verified_on: 2026-03-14
phase: 12
phase_name: Manual Validation And Test Hygiene

## Environment

- Frontend deployment: `https://milo-task-analysis-builder.vercel.app`
- Backend deployment: `https://milotaskanalysisbuilder.onrender.com`
- Milo auth backend used during validation: `https://milo-zolp.onrender.com`
- Browser: Google Chrome on laptop
- Additional device context reported during debugging: Chrome mobile emulation / Android user agent observed in network traces

## Manual Validation Timeline

### Attempt 1: Public share and shared-present entry

- Result: `blocked`
- Issue observed:
  - Login redirect pointed to `https://milo-zolp.onrender.com/login?returnUrl=...`
  - Backend responded `403 Forbidden`
- Impact:
  - Shared-flow walkthrough could not proceed reliably because authenticated duplication and owner follow-up history checks were blocked by the login boundary
- Follow-up:
  - Frontend auth flow was changed to use local `/auth/login` and `/auth/register` bridge pages that call Milo auth endpoints directly, following the Symwriter pattern

### Attempt 2: Authenticated app usage after login fix

- Result: `blocked`
- Issue observed:
  - Browser blocked `GET /api/auth/me` with CORS failure from `https://milo-task-analysis-builder.vercel.app` to `https://milotaskanalysisbuilder.onrender.com`
- Impact:
  - Post-login session bootstrap could not complete
- Follow-up:
  - Backend CORS configuration was updated to allow the deployed Vercel origin

### Attempt 3: Task save and share generation flow

- Result: `failed`
- Issues observed:
  - `PUT /api/tasks/{id}` returned `400 Bad Request`
  - Text inputs lost focus on every keypress during editing
- Impact:
  - Tasks were not being persisted, so `/shared/:token` could not reflect saved task content consistently
- Follow-up:
  - Frontend step ids were corrected to use UUIDs accepted by the backend
  - Step-list rendering was stabilized with `trackBy` so text inputs no longer lost focus while editing

### Attempt 4: Shared view and shared present after save/auth fixes

- Result: `partial_pass`
- Manual observations reported by user:
  - Shared view opened
  - Present mode flow worked
  - Symbols were not visually rendered in either shared view mode or present mode
  - Browser used: Google Chrome on laptop
- Follow-up:
  - Read-only symbol rendering was fixed to reuse the shared symbol catalog glyphs across shared view, present mode, preview, and export surfaces

## Flow Outcomes

### Public share walkthrough

- Environment: deployed Vercel frontend + deployed Render backend
- Browser: Google Chrome on laptop
- Final observed result before follow-up code fix: `fail`
- Notes:
  - View mode and present mode were reachable
  - Guided present navigation worked
  - Symbol payloads existed but glyphs were not shown visually
  - The issue was isolated to frontend rendering, not share-route reachability

### Shared completion to owner history

- Environment: deployed Vercel frontend + deployed Render backend
- Browser: Google Chrome on laptop
- Result: `blocked`
- Notes:
  - The session-history walkthrough was not completed with final post-fix manual confirmation in this phase log
  - Earlier blockers included auth/login and task-save failures
  - Minimal session tracking remained covered by automated backend/frontend verification

### Print-to-PDF walkthrough

- Environment: not completed in a final post-fix manual pass
- Browser: not recorded
- Result: `blocked`
- Notes:
  - A fresh manual browser print-to-PDF walkthrough was not captured in this phase
  - Export remains covered by automated route/component/build verification only

## Acceptance Position

- Phase 12 captured real deployed-environment blockers instead of inventing manual passes
- The blockers led directly to shipped follow-up fixes in auth, CORS, save behavior, focus stability, and symbol rendering
- End-to-end manual validation is therefore only partially complete in the repo history
- Remaining missing manual reruns are accepted as non-blocking milestone debt rather than open product-scope gaps
