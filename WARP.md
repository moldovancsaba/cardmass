# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Summary
- Next.js 15 App Router app (React 19, TS 5, Tailwind v4) with a MongoDB backend
- Multi-tenant, UUID-first model: all org/board/card identifiers are UUID v4
- Org-scoped APIs under /api/v1/organizations; requests must include X-Organization-UUID matching the org path segment (guarded by middleware)
- Core UI: hashed routes /{organizationUUID}/{boardUUID}/tagger for N‑dimensional card placement; dedicated card pages at /{organizationUUID}/cards/{cardUUID}
- Governance: timestamps in ISO 8601 with milliseconds (UTC), no tests, no breadcrumbs, strict version/doc sync

Common commands
- Install: npm install
- Dev (port 4000): npm run dev
  - Alt: npm run dev:turbo (Turbopack)
- Build: npm run build
- Start (prod, port 4000): npm start
- Lint: npm run lint
- Purge DB (danger — drops the database): npm run db:purge

Operational scripts (node)
- Version/doc sync: node scripts/sync-version.mjs [--check]
- DB verification (writes/updates/deletes a throwaway doc): node scripts/verify-db.mjs
- Migration — add organizations and backfill UUIDs (dry run): MIGRATE_DRY_RUN=true node scripts/migrations/001-add-organizations-and-backfill-uuids.mjs
  - Execute (no dry run): node scripts/migrations/001-add-organizations-and-backfill-uuids.mjs
- Migration — backfill order per status: node scripts/migrate-add-order.mjs [--dry]
- Migration — backfill uuid on legacy cards: node scripts/migrate-add-uuid.mjs [--dry]
- Migration — normalize legacy statuses: node scripts/migrate-statuses.mjs
- Admin — purge all boards (dry run): DRY_RUN=1 node scripts/admin/purge-boards.mjs
  - Execute (danger): node scripts/admin/purge-boards.mjs --confirm ALL
- Debug — list boards in org: node scripts/debug/print-boards.mjs <orgUUID>
- Debug — show board details: node scripts/debug/print-board.mjs <boardUUID>

Environment
- Required: MONGODB_URI
- Optional: MONGODB_DBNAME (default: cardmass)
- Optional: NEXT_PUBLIC_BASE_URL (server-side fetch to self when host headers are unavailable)
- Node: >= 20.x (LTS)

Architecture (big picture)
- App Router (app/):
  - API surface: app/api/v1/organizations/*
    - Organizations: list/create/fetch/update/delete; admin-by-slug at app/api/v1/organizations/slug/[slug]
    - Boards: list/create/fetch/update/delete within org
    - Cards: list/create/fetch/update/delete within org; archived filtering via ?archived=only|include|default(exclude)
  - UI routes:
    - /: OrgHome, admin entry points
  - /{organizationUUID}/{boardUUID}/tagger: Tagger UI (grid areas, inbox, drag+drop placement). Applies per-board background CSS (background-* only) if present.
    - /{organizationUUID}/cards/{cardUUID}: Card details (colored hashtags from per-board area styles)
    - /organization/[slug]: admin UX by slug (metadata-only)
- Middleware guard (middleware.ts): enforces X-Organization-UUID header presence/format and equality with org segment for /api/v1/organizations/*
- Data model (MongoDB):
  - organizations: { uuid, name, slug, description?, isActive, createdAt, updatedAt }
  - boards: { uuid, organizationId, slug?, rows, cols, areas[], background?, version, createdAt, updatedAt }
  - cards: { uuid, organizationId, text, status, order, createdAt, updatedAt, boardAreas?: Record<string,string>, isArchived? }
  - spock (inbox) is never persisted; an empty mapping implies spock on a given board
- Libraries (src/lib):
  - db.ts (MongoDB client), validation.ts (isUUIDv4), http/headers.ts (ORG_HEADER), http/fetchWithOrg.ts (header helper), urls.ts, types.ts (Board.background, Area.bgColor/textBlack/rowFirst), color/date/datetime utils
  - settings-default.ts and /api/settings route feed a client SettingsProvider (src/lib/settings.tsx)
- Path alias: @/* → ./src/* (tsconfig.json)
- Legacy surfaces: src/app/** contains older pages; primary UI and APIs live under app/**

Governance and conventions
- Timestamps: always ISO 8601 with milliseconds in UTC (non-negotiable)
- Navigation: no breadcrumbs
- Tests: not present and not allowed (MVP policy)
- Versioning and Release Protocol (summary):
  - Before running dev: increment PATCH
  - Before committing: increment MINOR (reset PATCH to 0), update all docs (README, ARCHITECTURE, TASKLIST, LEARNINGS, ROADMAP, RELEASE_NOTES) and keep package.json in sync
  - Major releases only when explicitly requested; update all documentation comprehensively
- Build verification policy (MANDATORY):
  - After any code change applied via automation or manual edits, run `npm run build` and address any errors before reporting success
  - Rationale: prevents broken main and ensures rapid feedback during refactors or UI changes
- Planning/logging:
  - Log plans and decisions in WARP.DEV_AI_CONVERSATION.md with ISO timestamps
  - Keep ROADMAP.md forward-looking, grouped by milestone/quarter with priorities and dependencies
  - Keep TASKLIST.md focused on active/upcoming tasks; move completed tasks into RELEASE_NOTES.md

Notes for API use and debugging
- All org-scoped API calls must send X-Organization-UUID equal to the org UUID in the path; middleware will reject mismatches
- During SSR where host headers are missing, fall back to NEXT_PUBLIC_BASE_URL to resolve self-fetch URLs

Testing
- Not applicable — no test runner is configured by design (tests are prohibited for this MVP)
