# Milo Task Analysis Builder

## What This Is

Milo Task Analysis Builder is a shipped v1 MVP for creating, presenting, sharing, tracking minimally, and exporting visual task analyses for therapists, teachers, educators, and families. It is aligned with the Milo ecosystem, uses Milo SSO in v1, and keeps a Milo/Symwriter-compatible operational interface.

## Core Value

Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.

## Current State

- Shipped version: `v1.0 MVP` on 2026-03-14
- Stack: Java REST backend on Render, Angular frontend on Vercel, Supabase/Postgres with dedicated schema
- Scope shipped:
  - Milo SSO authentication
  - dashboard and task library
  - task metadata and step authoring
  - media supports with text, symbol, and image
  - support variants
  - guided present mode
  - public sharing and duplicate-from-share
  - minimal session tracking
  - browser-print PDF export
- Accepted residual debt from closeout:
  - no final post-fix manual rerun recorded for owner-history and print-to-PDF
  - non-blocking Karma mocked-media warnings
  - non-blocking Mockito dynamic-agent warning on JDK 21

## Requirements

### Validated

- [x] Professionals can create structured visual task analyses for daily, school, and social skills - v1.0
- [x] Each task analysis can be executed inside the app in a guided step-by-step present mode - v1.0
- [x] Task analyses can be shared through public links for viewing or guided use without requiring an account for the recipient - v1.0
- [x] Shared task analyses can be duplicated into the recipient's own Milo space - v1.0
- [x] The app supports multimodal visual supports per step, including text, symbol, and image/photo - v1.0
- [x] The product supports different support levels through task variants - v1.0
- [x] The app records minimal completion sessions for guided runs - v1.0
- [x] The app provides printable PDF export for real-world use - v1.0
- [x] v1 authentication uses Milo SSO only - v1.0

### Active

- [ ] Reuse global Milo entities for children, classes, and shared users instead of freeform labels
- [ ] Add per-step tracking with help level, timing, and notes
- [ ] Introduce workspace/team collaboration with roles and shared libraries
- [ ] Support assignment flows toward children or groups with family/school access boundaries
- [ ] Explore automation features such as generated variants, text simplification, and QR distribution

### Out of Scope

- Native mobile apps until the web product proves insufficient in real usage
- Backend-generated PDF pipeline until browser-print export becomes a proven limitation
- Full clinical analytics until minimal tracking and assignment workflows are validated

## Next Milestone Goals

The next milestone should focus on ecosystem convergence and operational depth rather than broadening v1 indiscriminately:

1. Reuse Milo global entities for children, classes, and user relationships.
2. Define the first assignment model linking task analyses to real recipients.
3. Expand tracking from session-level completion into step-level execution evidence.
4. Decide whether collaboration lands before or after advanced tracking, based on product and buyer priority.

## Context

The shipped MVP proves the core loop: authenticated professionals can create visual task analyses, run them in guided present mode, share them safely, and export them for offline use. The product remains positioned between visual editor, operational teaching tool, reusable educational library, and lightweight execution tracker.

The next product risk is no longer "can the basic loop exist?" but "which ecosystem and workflow expansion creates the most value next?" The strongest next candidates are Milo global entities, assignment, deeper tracking, and structured collaboration.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Java REST backend on Render | Stay aligned with the Milo ecosystem backend stack | Good |
| Angular frontend on Vercel | Stay aligned with existing Milo apps and deployment model | Good |
| Dedicated Supabase schema separate from `milo` | Keep app data isolated while preserving ecosystem integration options | Good |
| Milo SSO only in v1 | Ship faster without duplicating auth/account systems | Good |
| Guided present mode in v1 | Make the product operational, not just an editor | Good |
| Minimal session tracking in v1 | Capture usage signal without dragging in clinical-model complexity | Good |
| Public link sharing plus duplicate-from-share in v1 | Maximize usefulness and reuse before collaboration/workspace features | Good |
| Milo/Symwriter-compatible visual language | Keep the app visibly inside the same ecosystem | Good |
| Browser-print PDF export for v1 | Ship practical export without backend PDF infrastructure | Revisit if print limitations become material |

## Constraints

- Backend remains Java REST on Render
- Frontend remains Angular on Vercel
- Database remains Supabase/Postgres with dedicated schema separation from `milo`
- Auth should continue to originate from Milo
- UX should remain visually compatible with Symwriter and Milo

---
*Last updated: 2026-03-14 after v1.0 milestone completion*
