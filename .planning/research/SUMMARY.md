# Research Summary: v1.1 Ecosystem Assignment

## Stack additions

- Add Milo entity integration for children, classes, and user relationships.
- Add local assignment persistence and APIs inside Task Analysis Builder.
- Keep Milo as source of truth for shared entities and Task Analysis Builder as source of truth for authored tasks plus assignments.

## Feature table stakes

- recipient selection from real Milo entities
- assignment creation from saved tasks
- assignment state visibility in task/library flows
- strict separation between assignment and public sharing

## Architecture direction

- integrate shared entities through read-oriented Milo gateways
- persist assignments locally with ecosystem references
- centralize recipient authorization in backend policy code

## Watch out for

- permission drift if entity access is not validated in backend
- scope blow-up if assignment, tracking, and collaboration all land together
- UX overload if assignment becomes mandatory for every authoring path

## Recommendation

Scope v1.1 around:
- Milo shared recipient reuse
- first assignment lifecycle
- assignment-aware UI and API boundaries

Defer:
- advanced per-step tracking
- workspace collaboration
- broader automation
