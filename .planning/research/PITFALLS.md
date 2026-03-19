# Milestone Research: Pitfalls

**Milestone:** v1.1 Ecosystem Assignment  
**Focus:** Milo shared entities and first assignment workflow

## Major pitfalls

### 1. Treating assignment like generic sharing

Assignment is not the same as public share. It carries recipient context, access boundaries, and operational ownership.

### 2. Copying Milo entities into a second source of truth

If child/class/user data becomes editable local state, drift and permission ambiguity appear quickly.

### 3. Overreaching into case management

If the milestone includes scheduling, team workflow, notes, analytics, and assignment together, scope will explode.

### 4. Weak authorization boundaries

Recipient lookup and assignment creation must both respect legitimate access rules. It is not enough to validate only at UI level.

### 5. Breaking the existing authoring loop

Replacing freeform labels should not force assignment decisions in every authoring path. Draft authoring and recipient assignment should remain separable where useful.

## Prevention strategy

- Treat Milo entities as externally owned references.
- Introduce assignment as a separate but adjacent workflow on saved tasks.
- Keep tracking and collaboration out of v1.1 requirements.
- Make recipient visibility and assignment authorization explicit in backend policy code.
