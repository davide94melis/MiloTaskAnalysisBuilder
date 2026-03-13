# Phase 1 Research: Milo SSO Foundation

## Objective

Research how to implement Phase 1 well:

- Milo-authenticated access without a second auth system
- durable session behavior in the new app
- backend authorization using Milo-issued identity plus app-specific access rules

## Phase Boundary

This phase is not the full product auth story. It only establishes the identity and trust boundary needed for the rest of the app:

- accept Milo-issued identity
- validate it in the new backend
- bootstrap an app-local user record in the new schema
- attach authenticated requests to app authorization rules
- keep the frontend session usable across refresh

It should not expand into sharing, public links, billing, or global Milo entities beyond identity.

## Local Ecosystem Findings

### Existing Milo/Symwriter Pattern

From the existing Milo and Symwriter repos:

- Milo backend issues application JWTs after login.
- Symwriter backend already accepts Milo JWTs as a fallback path when local JWT validation fails.
- That fallback uses a shared `APP_JWT_SECRET`, a `MiloJwtService` parser, and `AuthService.resolveUserIdFromMiloToken(...)`.
- Symwriter frontend stores the token in local storage and attaches `Authorization: Bearer ...` on `/api/` requests.

This is the strongest signal for Phase 1: do not invent a different SSO pattern for the new app. Reuse the established Milo-issued JWT trust model and app-local user bootstrap approach.

### Practical Architecture Pattern

The likely V1 shape is:

1. Milo frontend or login flow yields a Milo JWT
2. Task Builder frontend stores or receives that token
3. Task Builder frontend sends the token on backend API calls
4. Task Builder backend validates the Milo JWT with shared secret
5. Task Builder backend resolves or creates the app-local user in its own schema
6. Security context is populated with the app-local principal

## Recommended Implementation Shape

### Backend

- Add a `MiloJwtProperties` or equivalent config object backed by `APP_JWT_SECRET`
- Add a `MiloJwtService` that parses Milo JWTs and extracts at least:
  - subject / Milo user UUID
  - email
- Add a request filter similar to Symwriter's `JwtAuthenticationFilter`
  - read bearer token
  - validate Milo JWT
  - resolve/create local user
  - attach authenticated principal to Spring Security context
- Add an app-local user bootstrap service
  - create user on first valid Milo login
  - keep a reference to Milo user UUID
  - store only what this app needs in V1

### Frontend

- Follow the existing Milo/Symwriter pattern:
  - config-driven `apiUrl`
  - auth service for token persistence
  - HTTP interceptor attaching bearer token to `/api/` requests
  - logout on `401`
- Keep session persistence simple in V1:
  - local storage token + current user snapshot
  - refresh-safe bootstrapping

### Data Model

Minimum app-local auth/identity data in this phase:

- local user row
- Milo user UUID reference
- email
- created/updated timestamps
- optional display fields only if needed immediately

Do not pull in children, classes, organizations, or app subscriptions in this phase.

## Critical Decisions For Planning

### 1. Trust Source

Use Milo JWT as the source of identity truth for this app.

Why:
- already proven in Symwriter
- lowest integration risk
- preserves ecosystem consistency

### 2. App-Local User Record

Create a local user record on first authenticated access.

Why:
- app still needs ownership, traceability, and future app-specific preferences
- avoids coupling every query directly to Milo schema

### 3. Authorization Boundary

Authentication comes from Milo identity, but authorization remains app-local.

Why:
- the app will need its own ownership rules for tasks, sessions, variants, and sharing
- Phase 1 must establish this split early

### 4. Schema Isolation

Use the new app schema exclusively for app data and only keep a Milo user reference.

Why:
- roadmap explicitly separates schemas
- reduces accidental cross-app coupling

## What To Avoid

- Do not introduce a second login/register system in this app
- Do not depend on Supabase browser auth flows directly if Milo JWT is already the ecosystem path
- Do not over-model organizations or global entities in Phase 1
- Do not embed sharing/public-link logic in auth foundations

## Validation Architecture

Phase 1 needs validation at three levels:

1. **Backend unit/service tests**
   - Milo JWT parsing
   - first-login local-user bootstrap
   - invalid token rejection

2. **Backend integration/security tests**
   - protected endpoint with valid Milo token
   - protected endpoint with invalid/missing token
   - refresh-safe auth continuity through repeated authenticated requests

3. **Frontend integration tests**
   - auth service restores token from storage
   - interceptor attaches bearer token
   - `401` triggers logout/redirect behavior

Manual verification is still needed for:

- first real Milo-to-app sign-in
- environment/config alignment in dev or staging

## Plan Implications

A strong Phase 1 plan should produce:

- one plan for backend auth boundary and local user bootstrap
- one plan for frontend token/session integration
- one plan for verification scaffolding and smoke validation if the codebase is still empty

These plans can likely run in two waves:

- Wave 1: backend auth foundation + frontend app bootstrap
- Wave 2: verification hardening and auth smoke coverage

## Sources

- Local Milo doc: `Milo/docs/deploy-milo-auth-migration.md`
- Local Milo frontend auth service/interceptor
- Local Symwriter backend Milo JWT integration
