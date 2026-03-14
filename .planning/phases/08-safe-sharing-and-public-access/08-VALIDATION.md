---
phase: 8
slug: safe-sharing-and-public-access
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 8 - Validation Strategy

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
| 08-01-01 | 01 | 1 | SHAR-01 | integration | `mvn test` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | SHAR-02 | integration | `mvn test` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | SHAR-03 | integration | `mvn test` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 2 | MEDI-03 | integration | `mvn test` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | SHAR-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 2 | SHAR-04 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 08-04-01 | 04 | 3 | SHAR-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 08-04-02 | 04 | 3 | SHAR-05 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 08-05-01 | 05 | 4 | SHAR-03 | regression | `mvn test` | ✅ | ⬜ pending |
| 08-05-02 | 05 | 4 | SHAR-04 | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 08-05-03 | 05 | 4 | MEDI-03 | regression | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `backend/src/test/java/com/milo/taskbuilder/task/PublicTaskShareControllerIntegrationTest.java` - safe DTO, token, and public media coverage anchor
- [x] `backend/src/test/java/com/milo/taskbuilder/task/PublicTaskShareFlowIntegrationTest.java` - revoked-link/media and authenticated duplicate flow coverage anchor
- [x] `frontend/src/app/features/present/task-shared-view-page.component.spec.ts` - public view boundary and duplicate affordance coverage
- [x] `frontend/src/app/features/present/task-guided-present-page.component.spec.ts` - public present route reuse and safe-field boundary coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Anonymous shared-view and shared-present flows on a deployed environment | SHAR-02, SHAR-03 | Real token handoff, browser context, and asset loading are environment-sensitive | Open a real shared view link and shared present link without auth, verify content loads and no owner-only controls are visible. |
| Duplicate-from-share login handoff with Milo | SHAR-04, SHAR-05 | Login redirect and return intent are difficult to prove fully with local automation alone | Start duplication while signed out, complete Milo login, and confirm a new private draft opens after return. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 35s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
