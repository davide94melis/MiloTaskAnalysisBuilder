---
phase: 12
slug: manual-validation-and-test-hygiene
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 12 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser walkthroughs + JUnit 5/Spring MockMvc + Jasmine/Karma |
| **Config file** | `backend/pom.xml`, `frontend/angular.json`, `frontend/karma.conf.js` |
| **Quick run command** | `npm test -- --watch=false --browsers=ChromeHeadless` or `mvn test` for the touched stack |
| **Full suite command** | `mvn test` and `npm test -- --watch=false --browsers=ChromeHeadless` and `npm run build` |
| **Estimated runtime** | ~40 seconds plus manual walkthrough time |

---

## Sampling Rate

- **After every task commit:** Run the relevant automated command for the touched stack
- **After every plan wave:** Run `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build`
- **Before `$gsd-verify-work`:** Full automated suite must be green and manual UAT evidence must be written
- **Max feedback latency:** 40 seconds for automation; manual checks recorded immediately after execution

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | None | manual-artifact | `rg -n "public share|shared present|session history" .planning/phases/12-manual-validation-and-test-hygiene/12-UAT.md` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | None | regression | `mvn test` | ✅ | ⬜ pending |
| 12-01-03 | 01 | 1 | None | regression | `npm test -- --watch=false --browsers=ChromeHeadless` | ✅ | ⬜ pending |
| 12-02-01 | 02 | 2 | None | manual-artifact | `rg -n "print-to-PDF|browser|page break|export" .planning/phases/12-manual-validation-and-test-hygiene/12-UAT.md` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | None | regression | `npm run build` | ✅ | ⬜ pending |
| 12-02-03 | 02 | 2 | None | artifact | `rg -n "404 warnings|Mockito dynamic-agent|accepted debt|reduced" .planning/phases/12-manual-validation-and-test-hygiene/12-VERIFICATION.md` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 3 | None | artifact | `rg -n "manual validation|Karma|Mockito|Phase 12" .planning/v1.0-v1.0-MILESTONE-AUDIT.md .planning/STATE.md .planning/ROADMAP.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing automated test infrastructure already covers all shipped behavior.
- [x] Existing validation artifacts for Phases 08, 09, and 10 define the manual surfaces that need to be rerun.
- [x] Phase-local evidence files can carry the missing manual signoff without introducing new product test frameworks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public share and shared present flow remain usable outside the editor | None | The audit gap is specifically missing human walkthrough evidence | Open a real `/shared/:token` task, verify view mode, enter present mode, complete the flow, and record what was observed. |
| Shared completion appears in owner session history | None | End-to-end ownership attribution and UI readability are experience-sensitive | Complete a shared-present run, then inspect the owner editor history surface and record whether the new session appears as expected. |
| Browser print export produces usable PDF output | None | Print preview, pagination, and PDF output are browser-engine dependent | Open `/tasks/:taskId/export`, trigger print, save to PDF, and record browser/version, page count, readability, and any layout defects. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or explicit manual-artifact verification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 40s for automation
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
