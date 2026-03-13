# Backend Deploy Notes

## Purpose

This backend joins the Milo shared-auth ecosystem. It validates Milo-issued JWTs and maps them into app-local users stored in the `taskbuilder` schema.

## Required Environment Variables

- `APP_JWT_SECRET`
  - Must be identical to the value used by Milo and sibling apps that trust Milo JWTs.
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## Auth Behavior

- Bearer tokens on `/api/**` are treated as Milo JWT candidates.
- Valid Milo JWTs are parsed by `MiloJwtService`.
- The backend resolves or creates a local app user from the Milo user UUID and email.
- `GET /api/auth/me` is the protected bootstrap endpoint for frontend session restore.

## Deployment Checklist

1. Provision the Postgres/Supabase database with the `taskbuilder` schema available.
2. Set `APP_JWT_SECRET` to the same shared secret already used by Milo.
3. Set datasource environment variables.
4. Start the backend and confirm `mvn -q -DskipTests compile` or the CI build is green.
5. Verify `GET /api/auth/me` returns `401` without a bearer token.
6. Verify `GET /api/auth/me` returns the current user payload with a valid Milo JWT.

## Scope Reminder

This backend does not implement local login, registration, or shared Milo entities in Phase 1. It only provides Milo SSO trust and app-local authorization bootstrap.
