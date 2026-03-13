# Pitfalls Research

## 1. Building A Generic Checklist Tool

- Warning signs:
  - Editor focuses on generic todo fields instead of educational support context
  - Present mode feels like a normal checklist page
- Prevention:
  - Design around support level, visual supports, and real session playback from the start
  - Keep present mode as a first-class surface, not a preview afterthought
- Phase to address:
  - Phase 1 and Phase 2

## 2. Overbuilding Clinical Tracking Too Early

- Warning signs:
  - Session model expands into per-step scoring, prompts, notes, and durations before core workflow is usable
  - Requirements start centering data collection over task usability
- Prevention:
  - Limit V1 to session-header tracking only
  - Treat detailed clinical telemetry as a separate validated need
- Phase to address:
  - Requirements definition and roadmap scoping

## 3. Weak Public Sharing Security

- Warning signs:
  - Public links reuse internal IDs directly
  - Shared routes expose edit metadata, author-only notes, or raw storage URLs
- Prevention:
  - Use scoped share tokens
  - Separate public DTOs from editor DTOs
  - Review asset access model before shipping sharing
- Phase to address:
  - Sharing phase

## 4. Media Workflow Friction

- Warning signs:
  - Uploading or replacing images is slow or confusing
  - Print output and playback do not use the same asset assumptions
- Prevention:
  - Define media model and storage policies early
  - Test authoring with realistic therapist/teacher workflows, not only developer data
- Phase to address:
  - Editor phase

## 5. Variant Model That Does Not Scale

- Warning signs:
  - Support-level variants require manual rebuilds from scratch
  - Small changes to a base task become error-prone across variants
- Prevention:
  - Decide early whether variants are independent copies with metadata, or parent-child derivatives
  - Start simple, but keep source linkage possible
- Phase to address:
  - Core domain phase

## 6. Designing For Admins Instead Of Real Sessions

- Warning signs:
  - Dashboard and editor look polished, but present mode is cluttered or fragile on tablets
  - The product is easy to demo but awkward to use with a child in front of you
- Prevention:
  - Prioritize large targets, low-distraction layouts, and full-screen playback
  - Treat mobile/tablet ergonomics as part of acceptance criteria
- Phase to address:
  - Present mode phase

## 7. Mixing Milo Global Entities Into V1

- Warning signs:
  - Schema starts referencing children/classes/team structures before the app proves standalone value
  - Roadmap early phases depend on cross-app entity sync
- Prevention:
  - Keep V1 scoped to SSO only
  - Design extension points for V2 global entities without hard dependency now
- Phase to address:
  - Architecture and roadmap phases

## 8. Print As An Afterthought

- Warning signs:
  - Export is deferred until after UI decisions make print output ugly or brittle
  - Media aspect ratios and layouts are inconsistent
- Prevention:
  - Treat print/export as a real output channel in requirements
  - Use a constrained printable layout model instead of screenshot-based export
- Phase to address:
  - Export phase
