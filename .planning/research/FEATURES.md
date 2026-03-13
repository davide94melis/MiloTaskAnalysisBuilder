# Features Research

## Table Stakes

### Authoring

- Create, edit, reorder, duplicate, and delete steps
  - Complexity: Medium
  - Dependency: task + step data model
- Attach visual supports per step: text, symbol, photo/image
  - Complexity: Medium
  - Dependency: media storage and editor UI
- Organize tasks by categories, tags, and level
  - Complexity: Low
  - Dependency: metadata model
- Template-based starting points
  - Complexity: Medium
  - Dependency: seed content and duplication flow

### Delivery / Usage

- Guided step-by-step playback mode
  - Complexity: Medium
  - Dependency: playback route/state and step rendering
- Mobile/tablet-friendly full-screen UI
  - Complexity: Medium
  - Dependency: responsive frontend and simple navigation
- Large, low-friction completion action
  - Complexity: Low
  - Dependency: playback component design

### Sharing

- Shareable links for viewing or use
  - Complexity: Medium
  - Dependency: public token model, visibility controls
- Duplicate into my space
  - Complexity: Medium
  - Dependency: ownership and cloning rules

### Operations

- Basic session tracking
  - Complexity: Low
  - Dependency: session table
- PDF export / printable material
  - Complexity: Medium
  - Dependency: layout generation and printable variants

## Differentiators

- Support-level variants of the same task
  - Complexity: High
  - Why it matters: directly matches clinical/educational fading workflows and differentiates from generic checklist tools.
  - Dependency: variant model, cloning/editing UX
- Mixed visual modalities per step: symbol only, photo only, text + symbol, text + photo
  - Complexity: Medium
  - Why it matters: different children respond to different representations.
- Presentation mode designed for real sessions, not generic productivity
  - Complexity: Medium
  - Why it matters: turns the product into an operational tool instead of a content editor.
- Reusable didactic library built from tasks and templates
  - Complexity: Medium
  - Why it matters: reduces repeated work across professionals and families.

## Anti-Features For V1

- Per-step clinical analytics with rich note taking
  - Why not now: high data-model and workflow complexity; validate value first.
- Full team workspaces and role systems
  - Why not now: changes onboarding, ownership, billing, and permissions significantly.
- Student assignment and longitudinal program tracking
  - Why not now: becomes a broader educational case-management product.
- AI-assisted automatic variants or generation
  - Why not now: interesting later, but not needed to prove core workflow.
- Marketplace/community discovery layer
  - Why not now: distribution problem can wait until content creation and duplication are proven.

## Feature Dependencies

- Public sharing depends on clear visibility model and safe asset delivery.
- Present mode depends on a stable authoring model first.
- Variants depend on a clean duplication and support-level abstraction.
- Export depends on visual support model and print-safe layouts.

## Requirements Implication

For V1, the must-have feature clusters are:

1. Auth and Milo-linked identity
2. Task library and metadata
3. Step editor with media support
4. Present mode
5. Sharing and duplication
6. Minimal session tracking
7. PDF export
