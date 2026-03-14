---
phase: 06
slug: support-variants
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 06 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Spring Boot Test + JUnit 5; Angular Karma + Jasmine |
| **Config file** | `backend/pom.xml`, `frontend/package.json`, `frontend/karma.conf.js` |
| **Quick run command** | `mvn test` |
| **Full suite command** | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` |
| **Estimated runtime** | ~50 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test` for backend tasks or `npm test -- --watch=false --browsers=ChromeHeadless` for frontend tasks
- **After every plan wave:** Run `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 50 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SUPP-01 | unit/integration | `mvn test` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | SUPP-03 | integration | `mvn test` | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | SUPP-03 | integration | `mvn test` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | SUPP-02 | unit/integration | `mvn test` | ✅ | ⬜ pending |
| 06-02-02 | 02 | 2 | SUPP-01 | integration | `mvn test` | ✅ | ⬜ pending |
| 06-02-03 | 02 | 2 | SUPP-02 | integration | `mvn test` | ✅ | ⬜ pending |
| 06-03-01 | 03 | 2 | SUPP-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 06-03-02 | 03 | 2 | SUPP-02 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 06-03-03 | 03 | 2 | SUPP-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 06-04-01 | 04 | 3 | SUPP-01 | component/integration | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 06-04-02 | 04 | 3 | SUPP-03 | component/integration | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` | ✅ | ⬜ pending |
| 06-04-03 | 04 | 3 | SUPP-01 | integration/manual | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Behavior focus:
- `06-01-03` proves family-aware repository/query outputs stay stable for standalone, root, and variant tasks.
- `06-02-03` proves the create-variant controller contract enforces support level and returns family-aware metadata.
- `06-03-03` proves family grouping cues do not regress existing library filtering and card readability.
- `06-04-03` proves the docs/verification closure is backed by green automated commands plus an explicit manual checklist outcome recorded in the plan summary.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Variant family grouping remains readable in the library instead of turning into a nested management UI | SUPP-03 | Visual scanning quality and card readability are only partially captured by component tests | Create a base task plus 2-3 variants and confirm the library still feels card-first and operational |
| Support-level-driven variant labels remain understandable when titles are similar | SUPP-01, SUPP-03 | Label clarity is primarily UX judgment | Create variants with identical titles but different support levels and confirm users can distinguish them quickly |
| Editor family panel is useful without implying collaboration or version diffing | SUPP-02, SUPP-03 | Scope cues and interaction framing need a manual read | Open a base task and a variant, inspect family navigation and confirm no comparison/version-management assumptions leak into UI |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 50s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
