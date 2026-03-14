---
phase: 12
slug: manual-validation-and-test-hygiene
status: ready
created: 2026-03-14
---

# Phase 12: Manual Validation And Test Hygiene - Research

## Goal

Close the remaining non-blocking milestone debt before archive:

- rerun the skipped manual browser walkthroughs called out by the milestone audit
- capture final UAT evidence so the milestone is not justified by automation alone
- decide whether the known Karma fixture-media `404` warnings and Mockito dynamic-agent warning should be reduced now or documented as accepted debt

## What The Audit Already Proves

The repo already has passing automated verification for all shipped v1 behavior:

- Phase 08 proves safe public share routes, share-scoped media access, and duplicate-from-share behavior
- Phase 09 proves minimal session persistence and owner-only history reads
- Phase 10 proves browser-print export wiring and saved-content export boundaries

Phase 12 therefore is not feature delivery. It is a confidence and closure pass over behavior that was already implemented and verified automatically.

## Remaining Debt To Close

From `.planning/v1.0-v1.0-MILESTONE-AUDIT.md`, the open debt is narrow:

1. Manual deployed-browser walkthroughs were not rerun for shared flows in Phase 08.
2. Manual browser walkthroughs were not rerun for session-history behavior in Phase 09.
3. Manual print-to-PDF checks were not rerun for Phase 10.
4. Frontend Karma still emits expected mocked-image `404` warnings.
5. Backend tests still emit the Mockito dynamic-agent warning on JDK 21.

## Constraints And Practical Implications

### Manual checks need an environment and seeded content

The manual flows are only meaningful if execution uses a real running app with:

- Milo SSO available or an already-authenticated owner session
- at least one saved task with mixed visual supports
- an active public share token for that task
- a browser with print preview support

If deployed infrastructure or production-like auth is unavailable during execution, the phase should still capture that fact explicitly instead of fabricating manual signoff.

### Warning cleanup must stay narrow

The warning items are non-blocking today. Late-cycle cleanup is only justified if it is surgical:

- Karma `404` warnings likely come from mocked image URLs used in component tests and may be reducible by stabilizing fixture asset paths or request stubbing
- the Mockito dynamic-agent warning on JDK 21 may require JVM arg or dependency-level adjustment; that is only worth doing if the change is low-risk and well-understood

If warning reduction starts to touch shared test infrastructure broadly, Phase 12 should prefer documenting accepted debt over destabilizing the milestone.

## Best Planning Shape

Phase 12 should stay small and sequential:

1. Record shared-flow and session-history manual UAT evidence first.
2. Record export print evidence and triage the warning noise second.
3. Re-audit and align milestone closure artifacts last.

This avoids mixing evidence capture with closure docs and keeps the remaining debt visible until the end.

## Recommended Evidence Artifacts

Execution should produce phase-local evidence that can be cited by the milestone audit:

- `12-UAT.md` for manual walkthrough notes, environment used, steps executed, and observed outcomes
- `12-VERIFICATION.md` for final pass/fail accounting across manual evidence and test-noise triage
- summary files per plan so the cleanup work is traceable like the earlier phases

Existing validation files for Phases 08, 09, and 10 should be updated only to reflect that the deferred manual checks were executed or explicitly remained deferred.

## Risks

- Manual browser validation can be blocked by missing auth, environment drift, or unavailable share tokens.
- Export print validation is browser-engine sensitive; the evidence should record the exact browser used.
- Warning cleanup can expand unexpectedly if it touches test harness assumptions.

## Planning Guidance

- Do not reopen shipped feature scope.
- Prefer evidence capture over code churn.
- Allow one narrow warning-reduction attempt, but keep an explicit fallback path to accepted debt documentation.
- Final closeout should update the milestone audit only after manual evidence exists.

## Validation Architecture

Phase 12 needs a mixed validation model:

- automated: rerun `mvn test`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build` as the objective baseline
- manual: run browser walkthroughs for public share, session history, and print export, then record the environment and outcomes in a dedicated UAT artifact
- audit: update milestone closure artifacts only if the manual evidence and warning-triage decision are both documented

This phase is Nyquist-compliant only if the final record includes real manual observations, not just references back to older automated verification.
