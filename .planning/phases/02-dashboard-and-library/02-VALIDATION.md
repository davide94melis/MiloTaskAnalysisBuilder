---
phase: 02
slug: dashboard-and-library
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Spring Boot Test + Angular/Karma |
| **Config file** | `backend/pom.xml`, `frontend/angular.json` |
| **Quick run command** | `mvn test` |
| **Full suite command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` plus `npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every backend task commit:** Run `mvn test`
- **After every frontend task commit:** Run `npm test -- --watch=false --browsers=ChromeHeadless`
- **After every plan wave:** Run `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LIBR-01 | integration | `mvn test` | yes | pending |
| 02-01-02 | 01 | 1 | LIBR-03 | integration | `mvn test` | yes | pending |
| 02-01-03 | 01 | 1 | LIBR-05 | integration | `mvn test` | yes | pending |
| 02-02-01 | 02 | 1 | UX-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 02-02-02 | 02 | 1 | LIBR-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 02-02-03 | 02 | 1 | LIBR-06 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 02-03-01 | 03 | 2 | LIBR-04 | integration | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |
| 02-03-02 | 03 | 2 | LIBR-05 | integration | `mvn test` and `npm run build` | yes | pending |
| 02-03-03 | 03 | 2 | LIBR-01 | smoke | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` | yes | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard feels operational and reassuring | UX-02 | Tone, hierarchy, and visual calm are not captured well by automated assertions | Sign in, open dashboard, verify the first screen surfaces clear task actions, recent drafts/templates, and non-technical copy aligned with Milo/Symwriter tone |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
