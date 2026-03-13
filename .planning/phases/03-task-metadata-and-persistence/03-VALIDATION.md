---
phase: 03
slug: task-metadata-and-persistence
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Spring Boot Test + Angular/Karma |
| **Config file** | `backend/pom.xml`, `frontend/angular.json` |
| **Quick run command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every backend task commit:** Run `mvn test`
- **After every frontend task commit:** Run `npm test -- --watch=false --browsers=ChromeHeadless`
- **After every plan wave:** Run the full backend and frontend suites plus `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 75 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | META-01 | integration | `mvn test` | yes | pending |
| 03-01-02 | 01 | 1 | META-03 | integration | `mvn test` | yes | pending |
| 03-01-03 | 01 | 1 | STEP-08 | integration | `mvn test` | yes | pending |
| 03-02-01 | 02 | 1 | META-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 03-02-02 | 02 | 1 | META-04 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 03-02-03 | 02 | 1 | STEP-08 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 03-03-01 | 03 | 2 | META-01 | integration | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 03-03-02 | 03 | 2 | STEP-08 | integration | `mvn test` and `npm run build` | yes | pending |
| 03-03-03 | 03 | 2 | META-04 | smoke | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Metadata and ordered steps survive browser refresh after save | STEP-08 | Real save/reload confidence is stronger with an end-user refresh flow than with isolated component assertions alone | Open `/tasks/:id`, edit metadata and step order, save, refresh, confirm values and order remain intact |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 75s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
