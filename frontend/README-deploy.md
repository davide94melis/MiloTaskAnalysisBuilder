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

## Phase 4 Frontend Contract

Phase 4 upgrades the task route into a real non-media step editor.

The frontend now supports:

- creating the first step from an empty task
- editing title and description inline
- toggling required or optional state
- editing support guidance and reinforcement notes
- entering estimated minutes
- moving steps up and down
- duplicating and deleting steps
- explicit task-level save and reload fidelity

The route container still owns load/save orchestration, while the dedicated step editor owns local step editing state.

## Phase 5 Frontend Contract

Phase 5 keeps `/tasks/:taskId` as the single authoring surface and adds mixed visual-support editing per step.

The frontend now expects:

- `POST /api/tasks/{taskId}/media/uploads` to return a task-scoped image descriptor for local draft use
- `GET /api/tasks/{taskId}` to return each step with nested `visualSupport.text`, `visualSupport.symbol`, and `visualSupport.image`
- `PUT /api/tasks/{taskId}` to persist the full ordered step array with those nested `visualSupport` values intact
- `GET /api/tasks/{taskId}/media/{mediaId}/content` to resolve authenticated media previews for saved image descriptors

Editor behavior in Phase 5:

- image uploads stay local to the current draft until the user explicitly saves the task
- text, symbol, and image combinations can coexist on the same step
- save/reload must preserve the exact visual-support payload the backend returns
- duplicated tasks are expected to reopen with the same saved visual supports still attached

The frontend should treat `mediaId` and `storageKey` as the stable saved identifiers. The returned image URL is a usable authenticated preview, not a permanent public asset URL.

## Phase 6 Frontend Contract

Phase 6 extends the existing library and editor routes with family-aware variant management while keeping the authoring surface explicit.

The frontend now expects:

- library cards to include `variantRole`, family root metadata, and family counts for visible labeling
- `GET /api/tasks/{taskId}` to include the same family fields plus `relatedVariants` for the editor side panel
- `POST /api/tasks` variant creation requests to use `variantSourceTaskId` and required `supportLevel`

Editor behavior in Phase 6:

- the task editor shows a compact `Variant family` panel with current role, base-task context, and sibling navigation
- `Crea variante` remains an explicit action that opens the new copied task after prompting for support level
- sibling navigation is informational and navigational only; it does not imply comparison, versioning, or collaboration tools
- variant editing still respects the same explicit save boundary already used for Phase 5 media and step authoring

The frontend must keep present-mode and sharing concerns out of this route. Guided playback belongs to Phase 7, and public/share-safe access belongs to Phase 8.

## Deployment Checklist

1. Set `API_URL` for the Task Builder backend.
2. Set `MILO_API_URL` for the Milo backend.
3. Generate `public/config.json` with `node scripts/write-config.js`.
4. Run `npm run build`.
5. Confirm the deployed app redirects unauthenticated users to Milo and restores state after token handoff.

## Scope Reminder

Phase 6 makes the task route family-aware for support variants, but it still does not include Phase 7 present-mode playback UI or Phase 8 public sharing/public media exposure.
