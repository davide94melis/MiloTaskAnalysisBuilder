# Phase 11 Research

## Goal

Plan Phase 11 so the milestone audit debt around planning artifacts can be removed without reopening product scope. This phase should make milestone closure cleaner by fixing documentation drift and restoring missing validation artifacts for already completed phases.

## Scope In This Phase

Phase 11 is planning hygiene only. It should address:

- checkbox drift in `REQUIREMENTS.md` for requirements already verified as complete
- missing `07-VALIDATION.md` and `08-VALIDATION.md`
- missing summary metadata convention across completed phases if that convention is still expected by audit workflows
- planning-state alignment so a re-audit does not keep reporting documentation-only debt

## Out Of Scope

Do not use Phase 11 to:

- change product behavior
- reopen feature requirements already satisfied in Phases 1 through 10
- rerun manual browser walkthroughs
- reduce runtime test noise in Karma or Mockito
- add backend/frontend functionality

Those concerns belong to Phase 12 or to explicit acceptance of residual debt.

## Repo Reality

The milestone audit reported:

- no unsatisfied requirements
- no integration gaps
- no broken user flows
- only non-blocking debt

That means this phase should stay narrow and artifact-focused. The risk is over-correcting by rewriting too many planning files or changing already-correct traceability.

## Recommended Cleanup Strategy

### 1. Treat traceability and verification as source of truth

The completed phase `VERIFICATION.md` files and the traceability table already agree that all v1 requirements are complete. The unchecked sharing/media boxes in the top checklist are documentation drift, not product gaps.

Recommended action:

- update only the drifting checkboxes in `REQUIREMENTS.md`
- do not remap or reset phase ownership for any v1 requirement

### 2. Backfill missing VALIDATION artifacts rather than weakening Nyquist discovery

The audit found `07-VALIDATION.md` and `08-VALIDATION.md` missing while adjacent phases have them. Since the completed phases already have stable verification evidence, the cleanest approach is:

- create retrospective validation strategy files for Phase 07 and Phase 08
- keep them honest about what was automated vs manual
- avoid changing the milestone audit logic just to hide the missing files

### 3. Decide whether summary frontmatter is still a required invariant

The audit expected `requirements-completed` frontmatter in summaries, but the existing repo convention appears to use plain markdown summaries without that field. There are two plausible fixes:

- backfill lightweight frontmatter into completed summaries
- or update the planning/audit expectation so summary files are not treated as malformed when verification already covers the requirements

For this repo, the lower-risk option is to normalize summary metadata in a minimal, mechanical way only if it can be done consistently across all completed summaries. If not, prefer documenting the invariant explicitly in the planning artifacts rather than partially backfilling it.

## Recommended Phase Shape

Use 3 plans:

1. **Artifact consistency sweep**
   - fix checklist drift
   - decide and apply the summary metadata normalization approach

2. **Validation backfill**
   - create `07-VALIDATION.md`
   - create `08-VALIDATION.md`
   - ensure they match the completed behavior and manual-vs-automated boundary

3. **Re-audit readiness**
   - update audit/state/roadmap artifacts only as needed
   - prove the milestone can be re-audited without documentation-only findings from Phase 11 scope

## Validation Architecture

This phase does not require product tests. The correct validation model is deterministic artifact verification:

- file presence checks for missing validation docs
- `rg` assertions for corrected checklist entries and expected metadata markers
- consistency checks across `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`, the audit report, and the new validation files

Recommended commands:

- quick: `rg -n "SHAR-01|MEDI-03|requirements-completed|nyquist_compliant" .planning`
- full: `rg -n "SHAR-01|MEDI-03|requirements-completed|nyquist_compliant" .planning && Get-ChildItem .planning\\phases\\07-guided-present-mode\\07-VALIDATION.md,.planning\\phases\\08-safe-sharing-and-public-access\\08-VALIDATION.md`

## Risks

- Touching many summary files could create noisy diffs for little value.
- Retrospective validation docs must not pretend manual checks were executed if they were not.
- The phase should not accidentally downgrade milestone status by reinterpreting already-passed requirements as pending.

## Planning Guidance

- Prefer narrow doc-only plans with explicit file ownership.
- Keep requirement lists empty in execution plans unless the plan really changes requirement status.
- Make the final plan prove re-audit readiness, not just file creation.
