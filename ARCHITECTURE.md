# ARCHITECTURE

Version: 0.9.0
Generated: 2025-09-27T16:12:42.000Z

1. Overview
- Single-DB, multi-tenant architecture with strict organization scoping.
- UUID-first design: organizations, boards, and cards are identified by UUID v4.
- Hashed routes only in the UI: /{organizationUUID}/{boardUUID}. Slugs are metadata and never used for routing.
- All timestamps must be ISO 8601 with milliseconds in UTC.
- No tests (MVP policy) and no breadcrumbs (Navigation policy).

2. Glossary
- organization: top-level tenant. All data is scoped under organizationId (UUID v4) and enforced at API boundaries.
- board: a page defined by a grid of areas around the same initiative. Identified by uuid (UUID v4). slug is metadata.
- area: a labeled territory on a board. Area labels are canonical (lowercase) and drive per-board placements.
- card: a single element with content. Cards are classifiable across boards via per-board placements.
- placement: per-board assignment of a card to an area on a specific board (persisted in boardAreas[boardSlug] = areaLabel). Never persist 'spock'.
- spock: a virtual inbox area per board, used for display when a card has no placement on that board. Never persisted.

3. Data model (MongoDB)
- organizations
  - uuid: string (v4, unique)
  - name: string
  - slug: string (unique; admin UX only)
  - description?: string
  - isActive: boolean
  - createdAt / updatedAt: ISO string (server emits ISO with ms, UTC)
  - Indexes: { uuid: 1 } unique, { slug: 1 } unique

- boards
  - uuid: string (v4, unique)
  - organizationId: string (org uuid; required; indexed)
  - slug?: string (metadata only)
  - rows: number
  - cols: number
  - areas: Area[]
  - version: number
  - createdAt / updatedAt: Date (server) / ISO (client)
  - Indexes: { uuid: 1 } unique, { organizationId: 1 }, { organizationId: 1, updatedAt: -1 }

- cards
  - uuid: string (v4, unique)
  - organizationId: string (org uuid; required; indexed)
  - text: string
  - status: 'delegate' | 'decide' | 'do' | 'decline'
  - order: number
  - createdAt / updatedAt: Date (server) / ISO (client)
  - boardSlug?: string (legacy; creation source, optional)
  - areaLabel?: string (deprecated; legacy single label)
  - boardAreas?: Record<string, string>
  - Indexes: { uuid: 1 } unique, { organizationId: 1, status: 1, updatedAt: -1 }

4. API surface (App Router)
- Organizations
  - GET /api/v1/organizations — list (public)
  - POST /api/v1/organizations — create (public); generates uuid; ISO timestamps
  - GET /api/v1/organizations/[orgUUID] — fetch by uuid (validate v4)
  - GET /api/v1/organizations/slug/[slug] — admin UX by slug (not for scoping)

- Boards (org scoped; requires X-Organization-UUID header to match path)
  - GET /api/v1/organizations/[orgUUID]/boards — list for org
  - POST /api/v1/organizations/[orgUUID]/boards — create under org; generates uuid; ISO timestamps
  - GET /api/v1/organizations/[orgUUID]/boards/[boardUUID] — fetch within org
  - PATCH /api/v1/organizations/[orgUUID]/boards/[boardUUID] — update allowed fields; bumps version; ISO timestamps
  - DELETE /api/v1/organizations/[orgUUID]/boards/[boardUUID] — delete within org

- Cards (org scoped; requires X-Organization-UUID header)
  - GET /api/v1/organizations/[orgUUID]/cards?status=&boardUUID= — list for org; optional filters
  - POST /api/v1/organizations/[orgUUID]/cards — create; inserts at top (min(order) - 1); ISO timestamps
  - GET /api/v1/organizations/[orgUUID]/cards/[cardUUID] — fetch within org
  - PATCH /api/v1/organizations/[orgUUID]/cards/[cardUUID] — partial update; ISO timestamps
  - DELETE /api/v1/organizations/[orgUUID]/cards/[cardUUID] — delete within org


5. Routing
- Hashed board URL: /{organizationUUID}/{boardUUID}
- Organization admin by slug (metadata): /organization/[slug]
- Slugs never appear in routing for the main board view.

6. Access guard (middleware)
- Middleware enforces that for org-scoped paths, the X-Organization-UUID header exists, is a UUID v4, and matches the path segment.
- Defense-in-depth: handlers also validate ids and organizationId ownership before reads/writes.

7. Current limitations and next steps
- boardAreas are still keyed by board slug (compat). A follow-up migration will introduce placements keyed by boardUUID.
- Legacy routes remain until Sunset; UI no longer depends on them.

8. Operational scripts
- scripts/migrations/001-add-organizations-and-backfill-uuids.mjs — creates organizations collection, backfills uuids and organizationId on boards/cards, and ensures indexes. Supports MIGRATE_DRY_RUN.
- scripts/maintenance/clear-spock-area.mjs — clears any legacy 'spock' in areaLabel.

9. Version & governance
- Follow Versioning and Release Protocol. Ensure version is consistent in package.json and all docs. All timestamps are ISO 8601 with ms, UTC.
