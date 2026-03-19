# Milestone Research: Features

**Milestone:** v1.1 Ecosystem Assignment  
**Focus:** Milo shared entities and first assignment workflow

## Table stakes

### Shared recipients

- Users can pick real children instead of freeform labels.
- Users can pick real classes/groups where the ecosystem already models them.
- Recipient search and selection is scoped to the authenticated user's allowed context.

### Assignment flow

- Users can create an assignment from a saved task.
- Assignment links a task to one child or one group context with clear ownership.
- Users can see current assignment state from the library or task detail view.

### Operational visibility

- Users can understand whether a task is unassigned, assigned to one recipient, or used across multiple assignments.
- Users can reopen and manage the assignment without re-authoring the task itself.

## Differentiators worth preserving

- Assignment should feel like a natural extension of the authored task flow, not a separate case-management product.
- Shared/public viewing should stay distinct from assignment.
- Authoring must remain simple even when recipient data becomes ecosystem-aware.

## Anti-features for this milestone

- Full care-plan or student-record management.
- Complex scheduling/calendar engine.
- Team collaboration redesign.
- Step-level analytics and longitudinal reporting.

## Complexity notes

- The hardest part is not UI selection but boundary definition:
  - who can see which recipients
  - who can assign to which recipients
  - what assignment changes do to present/share/session flows
