# Milestone Research: Architecture

**Milestone:** v1.1 Ecosystem Assignment  
**Focus:** Milo shared entities and first assignment workflow

## Integration model

- Keep task authoring and saved-task lifecycle inside Task Analysis Builder.
- Resolve children/classes/users through Milo ecosystem integration boundaries.
- Persist assignment records locally with foreign references to Milo entities.

## Suggested components

### Backend

- `MiloEntityGateway`
  - resolves children/classes/user relationships available to current user
- `AssignmentService`
  - validates assignment creation and lifecycle transitions
- `AssignmentController`
  - exposes create/list/detail/update assignment routes
- `RecipientAccessPolicy`
  - centralizes recipient visibility and assignment authorization rules

### Frontend

- recipient search/select component
- assignment panel on task detail/editor route
- assignment list summaries in library/dashboard

## Data flow

1. Authenticated user opens a saved task.
2. Frontend loads available recipient options for that user context.
3. User creates or updates an assignment against the saved task.
4. Backend validates access to target recipient and persists assignment metadata.
5. Library/task detail surfaces reflect assignment state without changing the authored task content.

## Build order

1. Shared entity read integration
2. Assignment data model and authorization
3. Assignment APIs
4. Recipient-aware UI and task flows
5. Operational verification across authoring/present/share boundaries
