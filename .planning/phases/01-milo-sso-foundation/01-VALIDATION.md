---
phase: 1
slug: milo-sso-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Spring Boot Test, Angular test runner (to be created if frontend exists in this repo) |
| **Config file** | `pom.xml` / Angular test config when frontend scaffold exists |
| **Quick run command** | `mvn test` |
| **Full suite command** | `mvn test` |
| **Estimated runtime** | ~30-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn test`
- **After every plan wave:** Run `mvn test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | integration | `mvn test` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-03 | unit | `mvn test` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-02 | frontend/service | `mvn test` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | AUTH-01, AUTH-02, AUTH-03 | smoke/integration | `mvn test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/test/...` - auth parsing and security tests for Milo JWT trust path
- [ ] `backend/src/test/...` - first-login local user bootstrap coverage
- [ ] `frontend` test harness or equivalent - auth service/interceptor restore and 401 behavior

*If backend/frontend scaffolding does not yet exist in this repo, the first execution wave must create the minimum runnable test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First real sign-in using a Milo-issued token in app environment | AUTH-01 | Depends on real cross-app config and shared secret alignment | Configure `APP_JWT_SECRET`, obtain Milo login token, call protected endpoint, confirm app-local user bootstrap |
| Session continuity across browser refresh with real frontend wiring | AUTH-02 | Needs actual browser storage and route boot sequence | Sign in, refresh protected page, confirm user remains authenticated and requests succeed |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
