# Milestone Research: Stack

**Milestone:** v1.1 Ecosystem Assignment  
**Focus:** Milo shared entities and first assignment workflow

## Recommended stack additions

- Keep the existing Java REST backend and Angular frontend.
- Prefer integration with existing Milo/Symwriter identity and entity sources instead of copying child/class/user data into a second system of record.
- Add backend integration services or adapters that resolve:
  - children
  - classes/groups
  - membership and role context
  - assignment recipients and visibility checks
- Add assignment-specific persistence in the Task Analysis Builder schema for:
  - assignment record
  - recipient reference
  - assignment status
  - timestamps and ownership metadata

## Backend additions

- Read-only Milo entity lookup layer for children, classes, and related user context.
- Assignment aggregate and API routes owned by Task Analysis Builder.
- Explicit authorization rules around who can assign to which recipients.
- Audit-friendly metadata on assignments and recipient resolution.

## Frontend additions

- Entity selectors replacing freeform target labels where assignment is involved.
- Recipient-aware task views and assignment creation flow.
- Assignment status surfaces in library/editor/detail routes.

## What not to add yet

- Full collaboration/workspace permission model.
- Deep analytics pipeline.
- Cross-app write-back to unrelated Milo entities unless required by the assignment contract.

## Integration note

The milestone should treat Milo as source of truth for shared entities and treat Task Analysis Builder as source of truth for authored tasks plus assignment records.
