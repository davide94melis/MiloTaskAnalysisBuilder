# Milo Task Analysis Builder Roadmap

## Milestones

- [x] **v1.0 MVP** - shipped 2026-03-14. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- [ ] **v1.1 Ecosystem Assignment** - in definition on 2026-03-18.

## Current State

v1.0 is archived as the shipped MVP with accepted non-blocking closeout debt.

v1.1 is now proposed as the next milestone focused on assignment flows with a narrower first scope than originally drafted:

- missing final post-fix manual rerun for owner-history and print-to-PDF flows
- persistent Karma fixture-media `404` warnings in frontend tests
- persistent Mockito dynamic-agent warning on JDK 21 in backend tests

## Proposed Roadmap

**4 phases** | **9 requirements mapped** | Shared-entity requirements currently unmapped

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 13 | Assignment Domain Foundation | Introduce the first assignment record and saved-task assignment creation flow. | ASSN-01, ASSN-02, ASSN-04 | 4 |
| 14 | Assignment Lifecycle And Boundary Safety | Let users manage assignments safely without breaking authoring or public-share boundaries. | ASSN-03, OPER-01, OPER-02 | 4 |
| 15 | Recipient-Aware Product Surfaces | Make assignment state visible across library/task flows and verify present/share/export continuity. | OPER-03, UX-04, UX-05 | 4 |
| 16 | Graphic Refactor for Task Editor UX | Refactor the authenticated task editor into a cleaner Symwriter-like workspace with a persistent action rail, focused step authoring area, and lighter secondary surfaces. | UI-REF-01, UI-REF-02, UI-REF-03 | 4 |

## Phase Details

### Phase 13: Assignment Domain Foundation

Goal: Introduce the first assignment record and saved-task assignment creation flow.

Requirements: ASSN-01, ASSN-02, ASSN-04

Success criteria:
1. User can create an assignment from a saved task to one child or one class/group.
2. The system persists assignment owner, recipient reference, timestamps, and basic status metadata.
3. User can reopen a saved task and see its current assignment target and state.
4. Assignment creation is available only from an authenticated saved-task workflow.

### Phase 14: Assignment Lifecycle And Boundary Safety

Goal: Let users manage assignments safely without breaking authoring or public-share boundaries.

Requirements: ASSN-03, OPER-01, OPER-02

Success criteria:
1. User can update or remove an assignment without rewriting the authored task content.
2. Draft authoring still works without forcing assignment at task-creation time.
3. Public share links remain operationally separate from assignment and never expose recipient identity implicitly.
4. Assignment management keeps clear boundaries between private operational use and public sharing surfaces.

### Phase 15: Recipient-Aware Product Surfaces

Goal: Make assignment state visible across library/task flows and verify present/share/export continuity.

Requirements: OPER-03, UX-04, UX-05

Success criteria:
1. Library and task detail clearly show whether a task is unassigned, assigned to a child, or assigned to a group.
2. Assignment creation and recipient selection feel like a natural extension of the current saved-task workflow.
3. Present, share, export, and session flows continue to work correctly after recipient-aware assignment support lands.
4. The overall product still reads as task-centric rather than a separate case-management tool.

## Sequencing Logic

- Phase 13 now starts directly from the minimum assignment domain.
- Phase 14 protects workflow boundaries so assignment does not contaminate draft authoring or public sharing.
- Phase 15 finishes the milestone by making the new model legible across the product and verifying continuity of existing saved-task flows.
- Phase 16 is reserved for the task-editor UX refactor after the assignment surfaces are stable.

## Next Up

**Phase 13: Assignment Domain Foundation** - Introduce the first assignment record and saved-task assignment creation flow.

`$gsd-discuss-phase 13`

Also available:
- `$gsd-plan-phase 13`
- For history: [.planning/milestones/v1.0-ROADMAP.md](/C:/Users/davmelis/Documents/MyGitHub/Milo%20-%20Ecosystem/MiloTaskAnalysisBuilder/.planning/milestones/v1.0-ROADMAP.md)

### Phase 16: Graphic Refactor for Task Editor UX

Goal: Refactor the authenticated task editor into a cleaner Symwriter-like workspace with a persistent action rail, focused step authoring area, and lighter secondary surfaces.

Requirements: UI-REF-01, UI-REF-02, UI-REF-03

Success criteria:
1. The editor uses a minimal top bar and removes the current redundant introductory/support blocks from the main page.
2. Metadata remains at the top while step authoring becomes a two-column workspace with focused editing on the left and ordered step cards on the right.
3. Secondary surfaces such as saved-task actions, public sharing, variants, and session history move behind icon-triggered modals opened from a Symwriter-style rail.
4. The new layout remains usable on laptop and smaller screens, with a persistent desktop rail and animated hamburger-to-X toggle on compact viewports.
