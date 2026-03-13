---
phase: 05
slug: media-support-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 05 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Spring Boot Test + JUnit 5; Angular Karma + Jasmine |
| **Config file** | `backend/pom.xml`, `frontend/package.json`, `frontend/karma.conf.js` |
| **Quick run command** | `mvn test` |
| **Full suite command** | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test` for backend tasks or `npm test -- --watch=false --browsers=ChromeHeadless` for frontend tasks
- **After every plan wave:** Run `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MEDI-01 | integration | `mvn test` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | STEP-03 | unit/integration | `mvn test` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | MEDI-02 | integration | `mvn test` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | STEP-03 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | STEP-04 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 2 | MEDI-01 | component | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 3 | MEDI-02 | integration/component | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 3 | MEDI-02 | integration | `mvn test` | ✅ | ⬜ pending |
| 05-03-03 | 03 | 3 | STEP-03 | integration/component | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 05-03-04 | 03 | 3 | STEP-04 | integration/component | `mvn test` + `npm test -- --watch=false --browsers=ChromeHeadless` + `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Behavior focus:
- `05-01-03` proves a fresh task-detail read after save returns usable media access for the same uploaded asset.
- `05-03-01` proves frontend save/reload preserves backend-returned media descriptors without degrading the step draft.
- `05-03-02` proves task duplication preserves saved media references and remains within the authenticated reliability boundary.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Media authoring still feels like task authoring rather than a file manager | STEP-03, STEP-04 | UX clarity and therapist workflow readability are difficult to prove fully in automation | Create a task with mixed visual supports across multiple steps and confirm the authoring route remains understandable without extra navigation |
| Uploaded image preview remains usable after explicit save and page reload | MEDI-01, MEDI-02 | End-to-end visual correctness and real browser rendering need manual confirmation | Upload an image to a step, save the task, refresh, and confirm the preview still renders from the returned media contract |
| Symbol + text and photo + text combinations remain visually distinct and non-conflicting | STEP-04 | Layout/readability is partially visual rather than purely behavioral | Build two mixed-modality steps and confirm each support block remains readable on desktop and mobile-width layouts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
