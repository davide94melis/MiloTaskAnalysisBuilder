# Requirements: Milo Task Analysis Builder

**Defined:** 2026-03-18  
**Core Value:** Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.

## v1 Requirements

### Shared Entities

- [ ] **GLOB-01**: User can search and select real Milo children instead of only entering a freeform target label.
- [ ] **GLOB-02**: User can search and select real Milo classes or groups where the ecosystem already exposes them.
- [ ] **GLOB-03**: Recipient options shown to the user are limited to the Milo entities that user is authorized to access.

### Assignment

- [ ] **ASSN-01**: User can create an assignment from a saved task analysis for one real child or one real class/group.
- [ ] **ASSN-02**: User can view the current assignment target and assignment state for a saved task analysis.
- [ ] **ASSN-03**: User can update or remove an existing assignment without changing the authored task content itself.
- [ ] **ASSN-04**: Assignment records preserve owner, recipient reference, timestamps, and basic status metadata.

### Operational Boundaries

- [ ] **OPER-01**: Draft authoring remains possible before creating any assignment.
- [ ] **OPER-02**: Public share links remain separate from assignment and do not implicitly expose recipient identity or assignment context.
- [ ] **OPER-03**: Present, share, export, and session flows continue to work correctly for saved tasks after recipient and assignment support is introduced.

### UX

- [ ] **UX-04**: User can understand from library or task detail whether a task is unassigned, assigned to a child, or assigned to a group.
- [ ] **UX-05**: Assignment creation and recipient selection feel like an extension of the existing saved-task workflow rather than a separate management product.

## v2 Requirements

### Advanced Tracking

- **TRCK-01**: User can track per-step completion status inside each session.
- **TRCK-02**: User can record help level used for each step during execution.
- **TRCK-03**: User can record per-step timing and professional notes.
- **TRCK-04**: User can review longitudinal session history and step-level patterns.

### Collaboration

- **COLL-01**: Teams can work in shared workspaces with role-based permissions.
- **COLL-02**: Teams can maintain shared task libraries across staff members.
- **COLL-03**: Tasks and assignments can be managed across shared staff contexts with role-appropriate access.

### Automation

- **AUTO-01**: User can generate task variants automatically from an existing task analysis.
- **AUTO-02**: User can generate or refine text simplifications automatically.
- **AUTO-03**: User can use QR codes for assignment distribution and execution access.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-step clinical tracking in v1.1 | Keep the milestone focused on entity reuse and first assignment boundaries |
| Team workspaces and role-based collaboration in v1.1 | Broadens permissions and ownership beyond the first assignment model |
| Scheduling or calendar engine | Assignment existence matters first; scheduling can come later |
| Full case-management records for children | The product should remain task-centric, not become a general student record system |
| Public assignment flows | Assignment should remain authenticated and operationally bounded |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GLOB-01 | Unmapped | Pending |
| GLOB-02 | Unmapped | Pending |
| GLOB-03 | Unmapped | Pending |
| ASSN-01 | Phase 13 | Pending |
| ASSN-02 | Phase 13 | Pending |
| ASSN-03 | Phase 14 | Pending |
| ASSN-04 | Phase 13 | Pending |
| OPER-01 | Phase 14 | Pending |
| OPER-02 | Phase 14 | Pending |
| OPER-03 | Phase 15 | Pending |
| UX-04 | Phase 15 | Pending |
| UX-05 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 9
- Unmapped: 3

---
*Requirements defined: 2026-03-18*  
*Last updated: 2026-03-19 after removing shared-recipient phase from v1.1 roadmap*
