# Stack Research

## Recommendation Summary

Build the product with the already chosen ecosystem and keep the architecture intentionally boring in V1:

- **Backend**: Spring Boot 3.x on Java 21, packaged with Docker for Render
- **Frontend**: Angular 20 application deployed as a static build on Vercel
- **Database**: Supabase Postgres with a dedicated application schema, strict RLS, and Supabase Storage for images/audio
- **Auth**: Milo SSO only in V1, validated server-side through shared JWT trust and Milo identity lookup

## Recommended Stack

### Backend

- **Spring Boot 3.x + Java 21**
  - Why: consistent with Milo, long-term support, strong REST ecosystem, easy integration with JWT validation and Postgres.
  - Confidence: High
- **Spring Web + Validation + Security**
  - Why: covers REST controllers, DTO validation, auth filters, and policy enforcement without extra framework churn.
  - Confidence: High
- **Spring Data JPA**
  - Why: enough for V1 CRUD, ordering, filtering, templates, and session tracking without introducing query complexity too early.
  - Confidence: High
- **Flyway**
  - Why: V1 needs schema discipline because the app has its own schema but must remain compatible with the shared Supabase project.
  - Confidence: High
- **PostgreSQL driver**
  - Why: direct fit with Supabase Postgres.
  - Confidence: High

### Frontend

- **Angular 20**
  - Why: aligned with Milo/Symwriter, mature routing/forms/state patterns, good fit for editor-style UIs.
  - Confidence: High
- **Angular CDK**
  - Why: drag-and-drop, overlays, a11y primitives, focus handling, keyboard support.
  - Confidence: High
- **SCSS + shared design tokens**
  - Why: the UI must stay visually compatible with Symwriter/Milo; design tokens are the safest way to preserve that.
  - Confidence: High
- **Minimal local state first**
  - Why: for V1 the app can rely on Angular signals/services and route-level state instead of a heavy global store.
  - Confidence: Medium

### Supabase

- **Dedicated schema for application tables**
  - Why: Supabase recommends isolating what should or should not be exposed; this app should not mix its operational tables into `public` or `milo`.
  - Confidence: High
- **RLS on all exposed tables**
  - Why: Supabase explicitly warns exposed schemas need RLS.
  - Confidence: High
- **Supabase Storage for media assets**
  - Why: step images, photos, symbols, and audio need one operational storage path with policy control.
  - Confidence: High
- **Signed URLs or controlled public share strategy**
  - Why: public playback links must not accidentally expose private assets or internal editor data.
  - Confidence: High

### Deployment

- **Render via Dockerfile for backend**
  - Why: Render's Docker flow is the safest path for JVM apps and reproducible builds.
  - Confidence: High
- **Vercel Git-based deploys for frontend**
  - Why: Vercel automatically detects Angular and supports preview deploys with minimal configuration.
  - Confidence: High

## Supporting Libraries Worth Using

- **MapStruct** for DTO mapping if API objects start to diverge from entities.
- **Lombok** only if already standard in your Java repos; otherwise skip and keep code explicit.
- **ngx-translate** only if multilingual support becomes real in V1. If not, avoid premature i18n infrastructure.
- **PDF generation server-side** with a Java HTML-to-PDF tool or PDF layout library.
  - Why: printed output is part of MVP and should be deterministic.

## What Not To Use

- **Do not introduce microservices**
  - V1 is one backend with clear modules, not a distributed system.
- **Do not add a heavy client state manager by default**
  - NGRX is useful later if cross-cutting client state becomes complex; V1 can stay simpler.
- **Do not rely on direct browser access to every app table**
  - Public links, duplication, and Milo SSO create nuanced authorization. Keep sensitive flows behind backend APIs.
- **Do not expose your app schema casually through Supabase Data API**
  - If tables are browser-accessible, RLS must be airtight; prefer explicit backend ownership for core workflows.

## Sources

- Supabase docs on private schemas, RLS, and API hardening
- Supabase storage schema/docs for asset handling
- Render Docker deployment docs
- Vercel Angular deployment docs
