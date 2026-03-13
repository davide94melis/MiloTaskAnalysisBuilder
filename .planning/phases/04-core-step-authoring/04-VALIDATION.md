---
phase: 04
slug: core-step-authoring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-13
---

# Phase 04 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Spring Boot test, Angular Karma/Jasmine |
| **Config file** | `backend/pom.xml`, `frontend/angular.json`, `frontend/karma.conf.js` |
| **Quick run command** | `mvn test` |
| **Full suite command** | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test` for backend-facing tasks or `npm test -- --watch=false --browsers=ChromeHeadless` for frontend-facing tasks
- **After every plan wave:** Run `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | STEP-01 | backend service | `mvn test` | existing | pending |
| 04-01-02 | 01 | 1 | STEP-02 | backend service | `mvn test` | existing | pending |
| 04-01-03 | 01 | 1 | STEP-05, STEP-06, STEP-07 | backend service | `mvn test` | existing | pending |
| 04-01-04 | 01 | 1 | STEP-01, STEP-02, STEP-05, STEP-06, STEP-07 | controller/API round-trip with explicit `1..n` ordering | `mvn test` | existing | pending |
| 04-02-01 | 02 | 2 | STEP-01 | frontend component empty state, add, move up/down, duplicate, delete | `npm test -- --watch=false --browsers=ChromeHeadless` | existing | pending |
| 04-02-02 | 02 | 2 | STEP-02 | frontend component inline title/description editing | `npm test -- --watch=false --browsers=ChromeHeadless` | existing | pending |
| 04-02-03 | 02 | 2 | STEP-05, STEP-06, STEP-07 | frontend component required toggle, support guidance, reinforcement notes, estimated time | `npm test -- --watch=false --browsers=ChromeHeadless` | existing | pending |
| 04-02-04 | 02 | 2 | STEP-01, STEP-02, STEP-05, STEP-06, STEP-07 | save payload composition and save/reload fidelity | `npm test -- --watch=false --browsers=ChromeHeadless` | existing | pending |
| 04-03-01 | 03 | 3 | STEP-01, STEP-02, STEP-05, STEP-06, STEP-07 | cross-stack regression | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` | existing | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Step authoring flow remains understandable for therapist/teacher workflows | STEP-01, STEP-02, STEP-05, STEP-06, STEP-07 | UX clarity and editing cadence are hard to assert fully with unit tests | Create a draft task, validate the empty state, add multiple steps, edit fields, move up/down, duplicate, delete, save, refresh, and confirm the flow stays readable and low-friction without any media affordances |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
