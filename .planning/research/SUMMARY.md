# Research Summary

## Stack

The chosen technical direction is sound for V1: Java Spring Boot on Render, Angular on Vercel, and Supabase for Postgres plus storage. The main architectural caution is not the stack itself but how strictly the app separates its own schema, public sharing surface, and Milo-linked identity boundary.

## Table Stakes

Users in this space expect:

- task and step authoring
- media-rich visual supports
- reusable templates
- guided playback
- sharing
- printable materials

If these are missing, the product risks feeling like an incomplete authoring prototype.

## Differentiators

The strongest differentiators for this product are:

- support-level variants
- clinically realistic playback mode
- mixed symbol/photo/text representations
- easy duplication and reuse across professionals and families

## Watch Out For

The biggest risks are:

- building a generic checklist tool instead of a task-analysis product
- overbuilding clinical tracking in V1
- weak security around public links and media
- poor tablet/full-screen usability during real sessions
- letting future Milo global-entity plans distort the V1 scope

## Implication For Requirements

Requirements should center on one tight V1 loop:

1. Milo-authenticated professional creates a task
2. enriches it with structured visual steps
3. runs it in present mode
4. shares it safely
5. optionally exports it
6. records a minimal completion event

Everything outside that loop should be treated as deferred unless it directly strengthens it.
