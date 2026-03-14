# Plan 08-01 Summary

## Outcome

Phase 8 now has a dedicated backend share-management foundation with persistent opaque tokens, mode-specific lifecycle control, and owner-authenticated APIs that do not weaken the existing task-detail contract.

## What Changed

- Added `taskbuilder.task_share` with task ownership, mode, opaque token, active state, revocation timestamp, and indexes that enforce one active link per mode per task.
- Added a dedicated share entity, repository, and service that keep sharing separate from task visibility and status while supporting create, list, regenerate, and revoke flows.
- Extended `TaskLibraryController` with authenticated owner endpoints for listing shares, creating a mode link, regenerating a mode link, and revoking a specific share.
- Added controller regression coverage for `401` when unauthenticated, owner happy paths for view and present links, regeneration, revocation, and non-owner rejection.
- Added one small adjacent test update so the existing MVC slice that loads `TaskLibraryController` also provides the new `TaskShareService` dependency.

## Verification

- `mvn test` in `backend/`: passed

## Notes

- `POST /api/tasks/{taskId}/shares` is idempotent per mode in v1: if an active link already exists for that mode, it is returned unchanged.
- `POST /api/tasks/{taskId}/shares/{mode}/regenerate` explicitly rotates that mode by revoking the prior active share and issuing a new token.
- No anonymous read routes, public media routes, or duplicate-from-share routes were introduced in this plan.
