# Phase 08 Research

## Goal

Plan Phase 8 so a task owner can publish safe public links for read-only viewing and guided present access, while keeping private editor data and non-required assets protected, and allowing authenticated recipients to duplicate the shared task into their own space.

## Requirements In Scope

- `SHAR-01`: generate a public view link for a task analysis
- `SHAR-02`: generate a public interactive link that opens the task directly in present mode
- `SHAR-03`: allow public links to open without authentication
- `SHAR-04`: limit public access to only the task data and assets intentionally exposed for sharing
- `SHAR-05`: allow authenticated recipients to duplicate a shared task into their own space
- `MEDI-03`: expose only the media required by the shared task

## Boundaries To Preserve

Phase 8 sits on top of the Phase 7 playback contract and should not collapse nearby roadmap boundaries:

- reuse guided present mode from Phase 7 instead of rebuilding session UI from scratch
- do not introduce persisted session tracking, completion history, or analytics; that is Phase 9
- do not expose editor-only or team-facing metadata accidentally
- do not weaken Milo SSO for normal authenticated flows; anonymous access must exist only on explicit shared routes
- do not expose a generic public media bucket; public asset access must stay task-share-scoped
- keep duplication copy-based, consistent with Phases 2, 5, and 6

## Starting Point From Phases 2 Through 7

The codebase already has the core task, media, duplication, and present-mode building blocks, but they are entirely owner/authenticated:

- authenticated routes only:
  - frontend route tree puts `/tasks/:taskId`, `/tasks/:taskId/preview`, and `/tasks/:taskId/present` under the auth-guarded shell
  - backend security currently requires authentication for every `/api/**` route
- task detail is rich and editor-shaped:
  - `GET /api/tasks/{taskId}` returns title, category, description, educational objective, professional notes, target label, support level, difficulty, visibility, author, family metadata, and full steps
  - this is appropriate for owner editing, but too broad to expose publicly as-is
- media is task-scoped and owner-checked:
  - media upload and media content routes both require an authenticated principal
  - media URLs inside task detail point back to `/api/tasks/{taskId}/media/{mediaId}/content`
- duplication already exists:
  - authenticated duplication copies task metadata, steps, symbols, and media metadata rows while reusing the same storage object
  - accessible sources are currently limited to owned tasks or templates
- guided present mode already exists:
  - `/tasks/:taskId/present` loads saved task detail and renders a child-facing session surface
  - current guided present mode is the obvious reusable UI for public interactive links

What is missing for Phase 8:

- no share token or public slug model
- no public task DTO
- no anonymous backend route
- no anonymous frontend route outside the auth-guarded shell
- no share-management UI in the editor
- no duplication path from a public share into an authenticated recipient-owned draft
- no media authorization model for anonymous task-specific reads

## Current Codebase Entry Points And Reusable Surfaces

### Frontend entry points

- `frontend/src/app/app.routes.ts`
  - currently all task routes live under `authGuard`
  - Phase 8 needs at least one unauthenticated route tree for shared access
  - likely shapes:
    - `/shared/:shareToken`
    - `/shared/:shareToken/present`
- `frontend/src/app/features/present/task-guided-present-page.component.ts`
  - already implements the local-only guided session behavior that public interactive sharing should reuse
  - the main gap is data source and public-safe rendering, not session mechanics
- `frontend/src/app/features/library/task-shell-editor-entry.component.ts`
  - already contains the action panel where sharing controls naturally belong
  - already communicates saved-only playback rules, which Phase 8 should preserve for sharing
  - likely place to add "create public view link" and "create public interactive link" controls
- `frontend/src/app/core/tasks/task-library.service.ts`
  - currently exposes only authenticated task APIs
  - Phase 8 likely needs separate public-read and share-duplication methods rather than overloading `getTaskDetail`

### Frontend reusable patterns

- the guided present component already sorts saved steps and derives local session state
- editor launch gating already treats saved content as the source of truth
- Angular signals and route-param-driven loading patterns are already in place and suitable for new shared surfaces

### Backend entry points

- `backend/src/main/java/com/milo/taskbuilder/library/TaskLibraryController.java`
  - currently owns authenticated task create/read/update/duplicate APIs
  - Phase 8 probably needs a sibling public-sharing controller instead of weakening this controller's owner contract
- `backend/src/main/java/com/milo/taskbuilder/task/TaskDetailService.java`
  - good source of aggregation logic for ordered steps plus media descriptors
  - not safe to expose directly because it is owner-only and returns editor/professional fields
- `backend/src/main/java/com/milo/taskbuilder/task/TaskDetailMapper.java`
  - reusable mapping pattern for steps and media
  - Phase 8 likely needs a separate mapper/DTO for "shared task detail" to avoid accidental field leakage
- `backend/src/main/java/com/milo/taskbuilder/task/TaskMediaController.java`
  - current media content route is authenticated only
  - Phase 8 needs a separate public media read path with share-token-based authorization
- `backend/src/main/java/com/milo/taskbuilder/task/TaskMediaStorageService.java`
  - currently enforces ownership before serving bytes
  - can likely be extended with a new load path that validates a share grant instead of owner identity
- `backend/src/main/java/com/milo/taskbuilder/task/TaskShellService.java`
  - already implements duplication semantics and step/media copy behavior
  - likely should stay the owner of duplication mechanics, with Phase 8 adding a new "duplicate from shared source" entry path

### Current schema and domain constraints

- `taskbuilder.task_analysis` currently has:
  - `status` constrained to `draft` or `template`
  - `visibility` constrained to `private` or `template`
- frontend models already mention `shared` in `TaskStatus`, but backend enums and Flyway constraints do not
- there is no table for:
  - share links
  - public access grants
  - public task snapshots
  - share-scoped media grants

This means Phase 8 definitely needs new persistence, not just controller work.

## Public Sharing Architecture Guidance

### 1. Do not reuse the owner task-detail DTO for public access

Current `TaskDetailResponse` contains fields that should not be assumed public:

- `professionalNotes`
- `visibility`
- `authorName`
- `sourceTaskId`
- `variantFamilyId`
- `variantRootTaskId`
- `variantRootTitle`
- `variantRole`
- `variantCount`
- `relatedVariants`
- `difficultyLevel`
- likely also `targetLabel`, depending on product intent

Even `supportGuidance` and `reinforcementNotes` need an explicit decision. They may be useful for adult-facilitated present mode, but they are also closer to professional guidance than child-facing content.

Recommendation:

- create a dedicated public DTO, not a flag on `TaskDetailResponse`
- decide field-by-field what a public consumer sees
- default to the smallest payload that still satisfies the phase success criteria

### 2. Use explicit share records, not guesswork from visibility/status

Do not overload existing `visibility` or `status` fields to mean "publicly shared now":

- current enum and DB constraints do not support it
- a task may need two link types at once:
  - public view
  - public interactive/present
- sharing should be revocable/regenerable independently from task edit state

Recommendation:

- add a dedicated share table, for example one row per link/grant
- each share record should capture at minimum:
  - share id
  - task id
  - owner id
  - access mode: `view` or `present`
  - opaque public token or slug
  - enabled/revoked state
  - created/updated timestamps

Optional but useful:

- duplicated-from share id
- last regenerated timestamp
- public label or share note if UI wants it later

### 3. Prefer opaque share tokens over guessable task ids

Public access should not be driven by raw task ids:

- task ids already exist inside authenticated URLs
- exposing raw ids would make route guessing and controller mistakes easier
- Phase 8 needs a separate authorization boundary, not "same endpoint but without auth"

Recommendation:

- use a random opaque token or slug dedicated to the share record
- public routes should resolve share token -> share record -> task
- keep authenticated owner routes task-id based

### 4. Model "view" and "present" as separate public modes

The success criteria require two public link types. Planning should decide whether these are:

- separate share records, each with its own token
- one share record plus mode-specific URLs

Safer recommendation for v1:

- separate share records or a share record with explicit `mode`
- public view should open a simple read-only task page
- public interactive should reuse guided present mode on a public-safe data source

This keeps UX explicit and avoids mode confusion.

## Backend / Frontend Contract Gaps To Close

### Current gap: there is no public-read contract

Authenticated `GET /api/tasks/{taskId}` is not suitable for anonymous consumers. Phase 8 likely needs:

- a public task detail endpoint for read-only viewing
- a public present endpoint or a shared DTO reused by the public present surface
- a public media endpoint that is share-authorized

Recommended contract shape:

- authenticated owner APIs stay unchanged
- add separate public APIs, for example:
  - `GET /api/public/shares/{token}`
  - `GET /api/public/shares/{token}/present`
  - `GET /api/public/shares/{token}/media/{mediaId}/content`

The planner can decide whether the first two return the same payload with a `mode` hint or two purpose-built DTOs.

### Current gap: there is no share-management contract

The owner cannot currently create or revoke a share. Phase 8 likely needs authenticated endpoints such as:

- `POST /api/tasks/{taskId}/shares`
- `GET /api/tasks/{taskId}/shares`
- `PATCH /api/tasks/{taskId}/shares/{shareId}`
- or a simpler v1 subset:
  - create/replace public view link
  - create/replace public present link

Minimum planning questions to settle:

- can an owner have one active link per mode, or multiple?
- is "regenerate" the same as revoke + recreate?
- does turning sharing off preserve the old token record as revoked, or delete it?

### Current gap: duplication only accepts owned or template sources

Current duplication uses `findAccessibleById(sourceTaskId, ownerId)`, where accessible means:

- owned by the user, or
- a template

Shared public tasks are neither. Phase 8 needs a new authenticated duplication flow for recipients.

Recommendation:

- do not weaken generic duplicate to accept arbitrary task ids
- add a dedicated authenticated endpoint that duplicates from a share token/grant
- reuse the existing copy mechanics after authorization succeeds

Likely shape:

- `POST /api/public/shares/{token}/duplicate`
- request requires authentication
- server resolves the shared task safely, then calls existing duplication logic or a shared internal helper

## Public Data Minimization Rules

Phase 8 will fail its main boundary if it ships anonymous access using the current rich owner model. The plan should define an explicit allowlist.

### Fields likely safe to expose publicly

- task title
- task description if intentionally considered end-user-facing
- ordered steps
- step title
- step description
- required/optional flag if useful for facilitators
- `visualSupport.text`
- `visualSupport.symbol`
- media descriptors only as needed to render the task
- maybe estimated minutes if product wants facilitator guidance

### Fields that should default to private unless explicitly approved

- `professionalNotes`
- author email/name
- visibility/status internals
- source task lineage
- variant family metadata
- target label if it can identify a child/group
- difficulty metadata
- support level metadata if it is editorial rather than end-user-facing
- support guidance and reinforcement notes unless the product explicitly wants facilitator-facing public shares

Planning implication:

- decide whether public links are child-facing only, facilitator-facing, or mode-specific
- if undecided, keep public DTO lean and omit the riskier fields

## Media Protection Model

### Current state

Today, media protection is simple:

- task detail emits authenticated media URLs
- media bytes are served only after owner validation
- duplicated tasks reuse storage keys but get new media metadata rows tied to the destination task

This is safe for Phases 5 through 7, but not enough for Phase 8.

### What Phase 8 must guarantee

`MEDI-03` and `SHAR-04` require more than "public image endpoint exists":

- only media attached to the shared task should be reachable
- public access should not reveal unrelated task media
- public access should stop working when the share is revoked
- media authorization should be bound to the share grant, not just the task id

### Recommended model

Do not create a globally public asset URL from `storageKey`.

Instead:

- resolve public media through a share-scoped controller path
- validate that:
  - share token exists and is active
  - share token mode allows the current route
  - requested media id belongs to the shared task
  - requested media id is actually attached to one of the task's persisted steps

Recommended public URL shape:

- `/api/public/shares/{token}/media/{mediaId}/content`

That keeps authorization near the HTTP boundary and avoids accidentally making raw task media public forever.

### Important implementation detail

Task media rows are task-scoped, not step-version-scoped snapshots. Public serving should therefore verify against current persisted step attachments on each request, not a stale cached list built once at share creation.

This matters because:

- an owner may remove or replace an image later
- a revoked or edited task should not keep exposing old assets by accident

### Reuse opportunity

`TaskMediaStorageService` already knows how to read bytes from storage and build URLs. The likely safe extension is:

- keep filesystem/storage read logic there
- add share-aware metadata validation outside or alongside owner validation
- add a separate public URL builder for public DTOs

## Reusing Guided Present Mode Safely

Phase 7 already built the session UI. The safest Phase 8 approach is to reuse it rather than rebuild public present mode.

### What can be reused directly

- local step index and completion behavior
- progress strip and completed-task state
- visual support rendering
- responsive phone/tablet/desktop treatment

### What should change for public present mode

- route source:
  - load by share token, not task id
- data service:
  - use a public DTO, not `getTaskDetail`
- escape links:
  - public route should not link back to the private editor or library
- metadata display:
  - keep it public-safe and avoid editor/family/owner context

Planning recommendation:

- factor a shared presentation component or shared view-model helpers if needed
- keep owner-present and public-present entry routes distinct
- avoid tightly coupling the public route to auth guard or owner-only navigation

## Duplication Flow For Authenticated Recipients

This is the most important authenticated/public crossover in the phase.

### What exists today

- `POST /api/tasks/{taskId}/duplicate` duplicates an accessible source into a new private draft
- copied steps and media reuse the stable Phase 5 storage boundary

### What Phase 8 needs

An authenticated recipient should be able to:

1. open a public shared task anonymously or while signed in
2. choose a duplicate/import action
3. if unauthenticated, be sent through Milo SSO and returned safely
4. after authentication, duplicate the shared task into their own private space

### Planning decisions required

- where the duplicate action lives:
  - public view page
  - public present page
  - both
- how auth handoff returns:
  - preserve the share token and intended action across Milo login
- whether duplication is always allowed for any active share or is mode-specific

### Implementation recommendation

- keep duplication authenticated only
- add a dedicated endpoint keyed by share token
- internally reuse `TaskShellService` copy logic so step/media copying stays consistent with Phases 2, 5, and 6
- ensure the duplicated copy is always private, owned by the recipient, and detached from the public token

## Likely Plan Decomposition

Use 4 to 5 plans in 3 waves.

### Wave 1

1. Share domain and backend authorization foundation
   - add Flyway migration for share records
   - add share entity/repository/service
   - define active/revoked share semantics
   - add authenticated owner APIs to create/list/regenerate/revoke share links

2. Public-read contract and anonymous route foundation
   - add public DTO(s) with explicit field allowlists
   - add public backend endpoints resolved by share token
   - register unauthenticated frontend routes for shared view and shared present
   - keep existing authenticated routes untouched

### Wave 2

3. Public view/present UI and safe media serving
   - build or adapt frontend pages using the new public DTO
   - reuse guided present interaction model for interactive shares
   - add share-scoped public media URLs and controller validation
   - remove any editor-only navigation/metadata from public surfaces

4. Authenticated duplicate-from-share flow
   - add duplicate endpoint keyed by share token
   - add frontend duplicate action from public surfaces
   - preserve token/intended action across Milo login if needed
   - navigate recipient to the newly created private draft

### Wave 3

5. Verification, regression coverage, and docs
   - backend tests for anonymous/public authorization and media scoping
   - frontend tests for unauthenticated routes and duplicate action behavior
   - docs for deployment/runtime expectations and Phase 8 boundaries

## Risks To Plan Around

- exposing the current `TaskDetailResponse` publicly and leaking `professionalNotes`, lineage, or owner metadata
- weakening `/api/**` authentication globally instead of carving out narrow public endpoints
- serving media by raw task id or storage key instead of share-scoped authorization
- forgetting that public duplication still must require Milo auth
- breaking the existing owner-present/editor routes while adding public routes
- overloading `status` or `visibility` instead of introducing a share domain model
- not deciding whether `supportGuidance`, `reinforcementNotes`, and `targetLabel` are public-safe, leading to accidental leakage
- failing to preserve the current save boundary and accidentally sharing draft-only changes
- implementing public access as a snapshot but failing to define what happens when the owner edits or revokes a share

## Verification Strategy

Phase 8 needs both backend authorization tests and frontend behavior tests. This is not a frontend-only phase.

### Automated backend verification

1. Share-management contract tests
   - authenticated owner can create a public view link
   - authenticated owner can create a public present link
   - unauthenticated requests are rejected
   - non-owner cannot manage another user's share

2. Public-read authorization tests
   - anonymous user can open active public share endpoints
   - invalid/revoked token returns `404` or equivalent non-leaky failure
   - public DTO excludes private fields
   - public present payload only returns saved task content

3. Public media tests
   - anonymous request can fetch media only through active share token
   - media not attached to the shared task is rejected
   - revoked share invalidates media access
   - owner media endpoint remains authenticated

4. Duplicate-from-share tests
   - authenticated recipient can duplicate from active share
   - unauthenticated duplicate attempt is rejected or requires login
   - new copy belongs to recipient and is private
   - copied steps and media remain intact

### Automated frontend verification

1. Route tests
   - public share routes are outside the authenticated shell
   - authenticated task routes remain guarded

2. Public page tests
   - shared view loads by token
   - shared present loads by token and reuses local session behavior
   - public pages do not show editor-only actions

3. Duplicate action tests
   - authenticated user can duplicate from shared page
   - unauthenticated user is redirected into Milo flow or shown the correct auth handoff

### Manual verification checklist

- generate both public link types for a saved task with mixed text/symbol/image supports
- open both links in a fresh browser without auth
- confirm the public surfaces do not expose professional notes, family metadata, or editor navigation
- confirm guided present still behaves like Phase 7 local session UI
- duplicate the shared task while signed in and confirm the new copy opens in the recipient's private editor
- revoke/regenerate a share and confirm old public links and public media URLs stop working
- edit a shared task after link creation and confirm public access reflects the intended current saved state only
- verify a task with removed image no longer exposes the old image through the public path

### Verification commands

- `mvn test`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run build`

## Nyquist-Style Validation Notes

Phase 8 has two main high-risk dimensions:

- authorization mode:
  - owner-authenticated
  - anonymous public
  - authenticated recipient via public share
- content type:
  - no image
  - text/symbol only
  - image present
  - mixed supports

Recommended minimum matrix:

- public mode: `view`, `present`
- auth state: `anonymous`, `authenticated recipient`, `owner`
- media state: `none`, `image`, `mixed`
- share state: `active`, `revoked`, `invalid`

Do not settle for one happy-path manual check. The planner should ensure at least one automated or manual proof exists for each axis.

## What Must Stay Out Of Scope In Phase 8

- persisted completion/session records or any Phase 9 tracking
- per-step timestamps, help levels, notes, or analytics
- team/workspace collaboration or role-based sharing
- assignment workflows tied to Milo global entities
- QR code distribution if it requires extra distribution mechanics; that is closer to later automation scope
- public editing
- version history or compare/merge across shared copies
- export/print behavior
- broad UX polish beyond what is needed to make sharing understandable and safe

## Planning Recommendation

Plan Phase 8 as a mixed backend/frontend authorization phase, not as a small UI extension. The safest approach is:

- add a dedicated share domain model with opaque tokens
- introduce separate public DTOs and public routes instead of weakening owner contracts
- reuse Phase 7 guided present behavior for public interactive access
- add share-scoped media authorization instead of global public asset URLs
- add a dedicated authenticated duplicate-from-share flow that reuses existing copy semantics

If the plan stays strict about public DTO minimization and share-scoped media access, Phase 8 can meet its goals without leaking editor data or undermining the authenticated app boundary.
