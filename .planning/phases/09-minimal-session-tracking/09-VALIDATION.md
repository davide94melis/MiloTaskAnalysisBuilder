---
phase: 9
slug: minimal-session-tracking
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 9 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Spring MockMvc, Jasmine/Karma |
| **Config file** | `backend/pom.xml`, `frontend/angular.json`, `frontend/karma.conf.js` |
| **Quick run command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless && npm run build` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test` or `npm test -- --watch=false --browsers=ChromeHeadless` for the touched stack
- **After every plan wave:** Run `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | SESS-01 | integration | `mvn test` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | SESS-02 | integration | `mvn test` | ✅ | ⬜ pending |
| 09-01-03 | 01 | 1 | SESS-03 | integration | `mvn test` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | SESS-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 2 | SESS-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 09-02-03 | 02 | 2 | SESS-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 09-03-01 | 03 | 3 | SESS-01 | regression | `mvn test` | ✅ | ⬜ pending |
| 09-03-02 | 03 | 3 | SESS-02 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 09-03-03 | 03 | 3 | SESS-03 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `backend/src/test/java/com/milo/taskbuilder/task/TaskSessionControllerIntegrationTest.java` - planned coverage for owner/shared session persistence and authorization
- [x] `frontend/src/app/features/present/task-guided-present-page.component.spec.ts` - planned completion-save and write-once coverage
- [x] `frontend/src/app/features/library/task-shell-editor-entry.component.spec.ts` - planned task history count and recent-session coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shared present completion persists for owner history | SESS-01, SESS-02 | Cross-browser end-to-end ownership attribution | Complete a `/shared/:token/present` run anonymously, then sign in as owner and confirm a new history record appears. |
| Completion UX remains understandable when save fails | SESS-01 | Network-failure copy and timing are experience-sensitive | Simulate a failing session create request and confirm the completed state remains visible with a non-blocking error message. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 35s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
