# Plan 08-02 Summary

## Outcome

Phase 8 now has a narrow public backend contract with anonymous share read routes, explicit safe DTOs, share-scoped media access, and an authenticated duplicate-from-share path that reuses the existing private-draft copy semantics.

## What Changed

- Added a dedicated public share controller and service under `/api/public/shares/{token}` for anonymous `view`, anonymous `present`, share-scoped media content, and authenticated duplicate-from-share.
- Added explicit public DTOs and a dedicated mapper so anonymous payloads do not reuse `TaskDetailResponse` and do not expose `professionalNotes`, `authorName`, `visibility`, `status`, `targetLabel`, lineage metadata, editor hints, or the v1 facilitator fields.
- Tightened `SecurityConfig` so only the intended public share `GET` routes are anonymous while the rest of `/api/**` stays authenticated, including duplicate-from-share.
- Extended media storage and share lookup support so public media URLs stay token-scoped and the bytes are served only after the token resolves to an active share and the media is still attached to a current persisted step.
- Added backend regression coverage for public-route authorization, DTO minimization, share-scoped media delivery, revoked or invalid token failures, media-attachment validation, and authenticated duplication from an active share.

## Verification

- `mvn test` in `backend/`: passed

## Notes

- Public media URLs now use `/api/public/shares/{token}/media/{mediaId}/content`; there is still no generic public storage or raw bucket URL.
- Duplicate-from-share stays on `POST /api/public/shares/{token}/duplicate`, but it still requires authentication and always returns a new private draft for the authenticated recipient.
- The backend public contract is intentionally smaller than the owner contract so later frontend work can consume a safe payload without inheriting editor-only fields.
