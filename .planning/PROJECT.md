# Milo Task Analysis Builder

## What This Is

Milo Task Analysis Builder is a shipped v1 MVP for creating, presenting, sharing, tracking minimally, and exporting visual task analyses for therapists, teachers, educators, and families. It is aligned with the Milo ecosystem, uses Milo SSO in v1, and keeps a Milo/Symwriter-compatible operational interface.

## Core Value

Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.

## Current State

- Shipped version: `v1.0 MVP` on 2026-03-14
- Stack: Java REST backend, Angular frontend on Vercel, Supabase/Postgres with dedicated schema
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
- [ ] Support assignment flows toward real children or groups with family/school access boundaries
- [ ] Preserve the current authoring, present, share, and export loop while replacing freeform recipients with ecosystem-linked data
- [ ] Define the minimum operational model for assigned tasks inside the Milo ecosystem

### Out of Scope

- Native mobile apps until the web product proves insufficient in real usage
- Backend-generated PDF pipeline until browser-print export becomes a proven limitation
- Full clinical analytics until minimal tracking and assignment workflows are validated

## Current Milestone: v1.1 Ecosystem Assignment

**Goal:** Connect Milo Task Analysis Builder to real Milo entities and introduce the first assignment workflow for real recipients.

**Target features:**
- Reuse Milo global entities for children, classes, and shared user relationships instead of freeform target labels.
- Introduce the first assignment model linking a saved task analysis to a real child or group.
- Preserve authoring, present, sharing, and export flows while making recipients ecosystem-aware.
- Define the minimal lifecycle and boundaries of an assigned task inside the Milo ecosystem.

## Context

The shipped MVP proves the core loop: authenticated professionals can create visual task analyses, run them in guided present mode, share them safely, and export them for offline use. The product remains positioned between visual editor, operational teaching tool, reusable educational library, and lightweight execution tracker.

The next product risk is no longer "can the basic loop exist?" but "how does the shipped loop connect to real Milo recipients and operational teaching workflows?" The strongest immediate candidate is Milo ecosystem convergence through shared entities plus a first assignment model, while deeper tracking and collaboration remain important follow-on expansions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Java REST backend | Stay aligned with the Milo ecosystem backend stack | Good |
| Angular frontend on Vercel | Stay aligned with existing Milo apps and deployment model | Good |
| Dedicated Supabase schema separate from `milo` | Keep app data isolated while preserving ecosystem integration options | Good |
| Milo SSO only in v1 | Ship faster without duplicating auth/account systems | Good |
| Guided present mode in v1 | Make the product operational, not just an editor | Good |
| Minimal session tracking in v1 | Capture usage signal without dragging in clinical-model complexity | Good |
| Public link sharing plus duplicate-from-share in v1 | Maximize usefulness and reuse before collaboration/workspace features | Good |
| Milo/Symwriter-compatible visual language | Keep the app visibly inside the same ecosystem | Good |
| Browser-print PDF export for v1 | Ship practical export without backend PDF infrastructure | Revisit if print limitations become material |
| v1.1 starts with entities + assignment before advanced tracking | Connect the shipped loop to real recipients before broadening analytics or collaboration | Pending |

## Constraints

- Backend remains Java REST
- Frontend remains Angular on Vercel
- Database remains Supabase/Postgres with dedicated schema separation from `milo`
- Auth should continue to originate from Milo
- UX should remain visually compatible with Symwriter and Milo

---
*Last updated: 2026-03-18 after starting milestone v1.1 Ecosystem Assignment*
