---
phase: 7
slug: guided-present-mode
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 7 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Spring MockMvc, Jasmine/Karma |
| **Config file** | `backend/pom.xml`, `frontend/angular.json`, `frontend/karma.conf.js` |
| **Quick run command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test` or `npm test -- --watch=false --browsers=ChromeHeadless` for the touched stack
- **After every plan wave:** Run `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PRES-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | PRES-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 2 | PRES-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | PRES-06 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 3 | PRES-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-03-02 | 03 | 3 | PRES-04 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-03-03 | 03 | 3 | PRES-05 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-04-01 | 04 | 4 | PRES-01 | regression | `mvn test` | ✅ | ⬜ pending |
| 07-04-02 | 04 | 4 | PRES-02 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 07-04-03 | 04 | 4 | PRES-06 | regression | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/app/features/present/task-guided-present-page.component.spec.ts` - route, responsive layout, navigation, and completion-state coverage anchor
- [x] `frontend/src/app/features/library/task-shell-editor-entry.component.spec.ts` - launch gating and editor-to-present wiring coverage
- [x] `backend/src/test/java/com/milo/taskbuilder/task/TaskDetailControllerIntegrationTest.java` - saved task-detail contract coverage reused by present mode

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tactile comfort on real phone and tablet hardware | PRES-02, PRES-04, PRES-06 | Click/tap ergonomics and reading comfort are device-sensitive | Launch a saved task in present mode on a phone and tablet, verify one-step focus, button reachability, and readable support content. |
| Adult-guidance disclosure feels secondary but accessible | PRES-02 | Copy hierarchy and facilitation affordance are experience-sensitive | Open a step with guidance and confirm the child-facing surface stays clean until the adult panel is deliberately opened. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
