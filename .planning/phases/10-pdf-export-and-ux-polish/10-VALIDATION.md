---
phase: 10
slug: pdf-export-and-ux-polish
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 10 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jasmine/Karma |
| **Config file** | `frontend/angular.json`, `frontend/karma.conf.js` |
| **Quick run command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `npm test -- --watch=false --browsers=ChromeHeadless && npm run build` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watch=false --browsers=ChromeHeadless`
- **After every plan wave:** Run `npm test -- --watch=false --browsers=ChromeHeadless` and `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | EXPT-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | EXPT-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | EXPT-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 2 | UX-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-02-03 | 02 | 2 | UX-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 3 | EXPT-01 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-03-02 | 03 | 3 | EXPT-02 | regression | `npm run build` | ✅ | ⬜ pending |
| 10-03-03 | 03 | 3 | UX-01 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 10-03-04 | 03 | 3 | UX-03 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/app/features/library/task-shell-editor-entry.component.spec.ts` - existing editor action coverage can be extended for export entry wiring
- [x] `frontend/src/app/features/present/task-playback-preview-page.component.spec.ts` or a new export-page spec - print/export rendering coverage anchor
- [x] `frontend/src/app/features/dashboard/dashboard-page.component.ts` and `frontend/src/app/features/library/library-page.component.ts` - existing routed surfaces available for UX-polish assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser print produces a usable PDF with mixed supports | EXPT-01, EXPT-02, EXPT-03 | Real print preview and page breaks are browser-engine dependent | Open a saved mixed-media task in the export route, trigger print, save to PDF, and confirm readable multi-page output with preserved order. |
| Visual compatibility with Milo/Symwriter | UX-01 | Brand fit is experiential and cross-surface | Review dashboard, library, editor, present, shared view, and export page together for hierarchy, action clarity, and consistent styling. |
| Export remains understandable as a saved-content action | UX-03 | Copy and action hierarchy are user-comprehension sensitive | From editor and preview flows, confirm users can distinguish save, preview, present, share, and export without re-reading dense help text. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
