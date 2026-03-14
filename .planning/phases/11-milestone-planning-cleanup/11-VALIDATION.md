---
phase: 11
slug: milestone-planning-cleanup
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 11 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | PowerShell artifact checks + ripgrep |
| **Config file** | none - planning artifact verification only |
| **Quick run command** | `rg -n "SHAR-01|MEDI-03|requirements-completed|nyquist_compliant" .planning` |
| **Full suite command** | `rg -n "SHAR-01|MEDI-03|requirements-completed|nyquist_compliant" .planning` and `Get-ChildItem .planning\\phases\\07-guided-present-mode\\07-VALIDATION.md,.planning\\phases\\08-safe-sharing-and-public-access\\08-VALIDATION.md` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick artifact check command
- **After every plan wave:** Run the full artifact verification command set
- **Before `$gsd-verify-work`:** All planning artifact checks must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | None | artifact | `rg -n "SHAR-01|MEDI-03" .planning/REQUIREMENTS.md` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | None | artifact | `rg -n "requirements-completed" .planning/phases` | ✅ | ⬜ pending |
| 11-02-01 | 02 | 2 | None | artifact | `Get-ChildItem .planning\\phases\\07-guided-present-mode\\07-VALIDATION.md,.planning\\phases\\08-safe-sharing-and-public-access\\08-VALIDATION.md` | ✅ | ⬜ pending |
| 11-02-02 | 02 | 2 | None | artifact | `rg -n "nyquist_compliant|Approval:" .planning\\phases\\07-guided-present-mode\\07-VALIDATION.md .planning\\phases\\08-safe-sharing-and-public-access\\08-VALIDATION.md` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 2 | None | artifact | `rg -n "checkbox drift|summary metadata|07-VALIDATION|08-VALIDATION" .planning\\v1.0-v1.0-MILESTONE-AUDIT.md .planning\\STATE.md .planning\\ROADMAP.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing planning artifacts are sufficient for deterministic verification.
- [x] No new product test framework or fixtures are needed.
- [x] Existing `rg` and PowerShell file checks cover the whole phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | None | All Phase 11 goals are planning-artifact checks | None |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
