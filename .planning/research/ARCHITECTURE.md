# Architecture Research

## Target Shape

This product should be built as a modular monolith with three major product surfaces sharing the same core domain:

1. **Library surface**
2. **Editor surface**
3. **Playback surface**

Each surface uses the same underlying task-analysis model but has different UX and authorization rules.

## Core Components

### 1. Identity and Access Boundary

- Milo SSO entry point
- Backend token validation / Milo identity resolution
- Application user profile bootstrap in the new schema

Purpose:
- Accept Milo-authenticated users without creating a separate auth system
- Map Milo user identity into the task-builder domain

### 2. Task Domain

- Tasks
- Step items
- Categories/tags
- Support-level variants
- Templates

Purpose:
- Own all authoring data and ordering logic
- Represent one canonical task plus optional variants

### 3. Media Domain

- Image/photo attachments
- Symbol references
- Optional audio
- Export-ready asset metadata

Purpose:
- Keep media concerns separate from core step ordering
- Support both authenticated editing and public playback safely

### 4. Sharing and Playback Domain

- Public share tokens / share links
- Playback route state
- Public visibility rules
- Copy/duplicate flow

Purpose:
- Make tasks consumable outside the authenticated editor
- Separate public playback concerns from private authoring concerns

### 5. Session Tracking Domain

- Session header only in V1
- Completed flag
- Timestamp
- User or actor context when available

Purpose:
- Provide lightweight usage evidence without per-step clinical detail

### 6. Export Domain

- PDF layouts
- Printable variants
- Asset resolution for print

Purpose:
- Support real-world use in schools, homes, and therapy settings

## Data Flow

### Authenticated Authoring Flow

1. User authenticates through Milo
2. Frontend calls backend with Milo-linked session/token
3. Backend validates identity and loads the app user context
4. User creates/edits tasks through backend APIs
5. Media uploads go through controlled storage flow

### Public Playback Flow

1. Authenticated user generates a share link
2. Backend issues a public share token with scoped permissions
3. Public frontend route resolves only the shareable task payload
4. Playback UI renders step-by-step mode
5. Session completion may optionally create a minimal session record

### Duplication Flow

1. User opens a shared task
2. Authenticated duplication action copies the task into the user's space
3. New task retains source reference only if useful for analytics later

## Key Boundaries

- **Never couple public playback directly to private editor endpoints**
- **Never let Milo schema concerns leak into this app schema beyond identity references in V1**
- **Keep media access rules separate from task ownership rules**
- **Keep tracking separate from step content so V2 analytics can evolve without rewriting editor models**

## Suggested Build Order

1. Milo SSO integration and app bootstrap
2. Core schema + task/step CRUD
3. Task library and dashboard basics
4. Editor UI with reordering and media support
5. Present mode
6. Sharing via public links
7. Minimal session tracking
8. PDF export
9. Support-level variants refinement

## Architecture Risks To Handle Early

- Public links exposing more task data than intended
- Asset URLs breaking in public mode
- Schema design that makes variants awkward later
- Overloading V1 with student-assignment concepts too early
