---
phase: 16
slug: graphic-refactor-for-task-editor-ux
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 16 - Validation Strategy

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
| 16-01-01 | 01 | 1 | UI-REF-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | UI-REF-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 2 | UI-REF-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 2 | UI-REF-02 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 3 | UI-REF-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 16-03-02 | 03 | 3 | UI-REF-01 | regression | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/app/features/library/task-shell-editor-entry.component.spec.ts` - existing editor-shell coverage anchor for top-bar, modal, and rail assertions
- [x] `frontend/src/app/features/library/task-step-authoring-editor.component.spec.ts` or equivalent coverage extension - step-workspace and card-selection coverage anchor
- [x] `frontend/src/app/features/library/task-metadata-form.component.ts` - existing metadata section available for layout hierarchy assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Desktop Symwriter-like rail feels usable and non-intrusive | UI-REF-03 | Spatial hierarchy and brand fit are experiential | Open the task editor on laptop/desktop width and confirm the rail stays visible, icon-led, and subordinate to the main authoring canvas. |
| Mobile/small-screen rail toggle works with animated hamburger-to-X transition | UI-REF-03 | Motion and responsive ergonomics are hard to validate meaningfully in unit tests | Resize to a compact viewport, open and close the rail repeatedly, and confirm the animated toggle stays understandable and stable. |
| Step creation/editing flow remains clear after split workspace conversion | UI-REF-02 | Focus quality and editing rhythm are workflow-sensitive | Create a new step, verify it appears in the right-side card board, select an existing card, and confirm editing happens in the left authoring area. |
| Secondary operational surfaces remain fully usable after modal migration | UI-REF-03 | Usability across sharing/variants/sessions/actions spans multiple modal interactions | Open each secondary surface from the rail and confirm viewing plus related actions can be completed without inline legacy panels. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-19

