# LEARNINGS

Version: 0.14.0

Updated: 2025-09-30T09:54:35.000Z

- Architecture: Adopted UUID-first, organization-scoped model. All org/board/card IDs are UUID v4. Slugs are metadata only.
  Why: Enables centralized development with strict tenant scoping and hashed routes.
- Access control: Enforced X-Organization-UUID header matching org path segment via middleware + per-route validation.
  Why: Defense-in-depth and clarity for data scoping.
- Migration: Fully removed legacy endpoints and UI routes; UUID-first org-scoped APIs are the only surface now.
  Why: Eliminate drift and complexity; enforce one clear integration path.
- Next.js nuance: In this codebase, PageProps.params is typed as Promise in server components under App Router; adjusted signatures accordingly.
  Why: Type alignment avoids implicit any and improves DX.
- TypeScript hygiene: Eliminated explicit any by introducing small types and safer globalThis guards.
  Why: Keep production builds lint-clean and improve maintainability.
- Timestamp standard: All timestamps across code and docs must be ISO 8601 with milliseconds in UTC (non-negotiable).
  Why: Consistency, precision, and interoperability.
- Grid alignment nuance: For CSS grid, explicitly set content-start and items-start (and justify-start as needed) on grid containers to ensure items anchor to the top-left.
  Why: Prevents vertical centering or space-around artifacts so boards remain predictable and dense at a glance.

- Process: Documentation governance enforcement
  Why: Consolidated docs, synchronized version/timestamps, and planned automation to prevent drift and ensure compliance.
