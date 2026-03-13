# Frontend Deploy Notes

## Purpose

The frontend uses runtime config plus a Milo login bridge to participate in Milo-backed authentication without introducing local credentials.

## Required Build Environment

- `API_URL`
  - Task Builder backend base API URL including `/api`
- `MILO_API_URL`
  - Milo backend base API URL including `/api`

Run:

```powershell
node scripts/write-config.js
npm run build
```

## Auth Behavior

- `AppConfigService` loads `public/config.json` at startup.
- `MiloAuthService` stores the Milo-backed token and restores the current user via `GET /api/auth/me`.
- `auth.interceptor.ts` adds `Authorization: Bearer ...` on `/api/` requests and clears auth state on `401`.
- `auth.guard.ts` restores session state before allowing access to the protected shell.
- `login-bridge.component.ts` redirects users into Milo instead of presenting a local login form.

## Phase 2 Frontend Contract

Phase 2 replaces the placeholder authenticated screen with:

- `/dashboard` - recent drafts, templates, and quick actions
- `/library` - task-card library with backend-driven filter options
- `/tasks/:taskId` - task-shell entry handoff used for create/reopen/duplicate flows

The frontend expects these Phase 2 backend payloads:

- dashboard summary with `recentDrafts`, `seedTemplates`, and `stats`
- library response with `items` plus `availableFilters`
- task-shell create/duplicate responses shaped like a task card

## Phase 3 Frontend Contract

Phase 3 upgrades `/tasks/:taskId` from a handoff page into a real metadata editor.

The frontend now expects:

- `GET /api/tasks/{taskId}` to return a task detail payload with metadata and ordered steps
- `PUT /api/tasks/{taskId}` to persist the current metadata form plus the current step order

The editor intentionally supports only:

- metadata editing
- reload-safe save behavior
- existing-row step reorder via simple controls

It does not yet implement full step creation or rich media authoring. That remains Phase 4 scope.

## Deployment Checklist

1. Set `API_URL` for the Task Builder backend.
2. Set `MILO_API_URL` for the Milo backend.
3. Generate `public/config.json` with `node scripts/write-config.js`.
4. Run `npm run build`.
5. Confirm the deployed app redirects unauthenticated users to Milo and restores state after token handoff.

## Scope Reminder

Phase 3 makes the task route real for metadata persistence, but it is still not the full authoring surface. Rich step editing and present-mode depth remain later-phase work.
