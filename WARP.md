# WARP.md

Version: 1.0.0
Updated: 2025-10-04T18:54:11.000Z

> Reference: `HANDBOOK.md` describes the unified workflow. This file details day-to-day commands and scripts.

This file provides guidance to WARP (warp.dev) and AI assistants when working with code in this repository.

## Summary

- Next.js 15 App Router app (React 19, TS 5, Tailwind v4) with MongoDB backend
- Multi-tenant, UUID-first model: all org/board/card identifiers are UUID v4
- Org-scoped APIs under /api/v1/organizations; requests must include X-Organization-UUID matching the org path segment (guarded by middleware)
- Core UI: hashed routes /{organizationUUID}/{boardUUID}/tagger for N-dimensional card placement; dedicated card pages at /{organizationUUID}/cards/{cardUUID}
- Authentication: Zero-trust with admin sessions (HttpOnly cookies) + per-board page passwords (32-hex tokens)
- Governance: timestamps in ISO 8601 with milliseconds (UTC), no tests, no breadcrumbs, strict version/doc sync

Common commands
- Install: npm install
- Dev (port 4000): npm run dev
  - Alt: npm run dev:turbo (Turbopack)
- Build: npm run build
- Start (prod, port 4000): npm start
- Lint: npm run lint
- Purge DB (danger — drops the database): npm run db:purge

## Operational Scripts (node)

### Admin Scripts
- **Create admin user**: `node scripts/admin/create-user.mjs [email] [name] [role]`
  - Interactive prompts if args not provided
  - Generates 32-hex password, outputs to stdout (store securely)
  - Alternative: `node scripts/create-admin.mjs` (interactive) or `node scripts/create-admin-quick.mjs` (quick)
- **Reset admin password**: `node scripts/admin/update-password.mjs <email>`
  - Generates new 32-hex password, hashes with MD5 before storing
  - Displays plaintext password for login (won't be shown again)
  - Fixed in v0.21.0 to properly hash passwords matching auth system
- **Test admin login**: `node scripts/test-login.mjs <email> <password>`
  - Tests POST /api/auth/login, GET /api/auth/check, DELETE /api/auth/logout
- **Purge all boards**: `DRY_RUN=1 node scripts/admin/purge-boards.mjs` (dry run)
  - Execute (danger): `node scripts/admin/purge-boards.mjs --confirm ALL`

### Database Scripts
- **Purge entire DB**: `npm run db:purge` (danger — drops the database)
- **Verify DB connection**: `node scripts/verify-db.mjs` (writes/updates/deletes throwaway doc)
- **Debug users**: `node scripts/debug-users.mjs` (lists all users with password hashes)

### Migration Scripts
- **Add organizations and backfill UUIDs**:
  - Dry run: `MIGRATE_DRY_RUN=true node scripts/migrations/001-add-organizations-and-backfill-uuids.mjs`
  - Execute: `node scripts/migrations/001-add-organizations-and-backfill-uuids.mjs`
- **Backfill order per status**: `node scripts/migrate-add-order.mjs [--dry]`
- **Backfill UUID on legacy cards**: `node scripts/migrate-add-uuid.mjs [--dry]`
- **Normalize legacy statuses**: `node scripts/migrate-statuses.mjs`
- **Migrate admin to super-admin**: `node scripts/migrate-admin-to-super-admin.mjs`
- **Ensure org access field**: `node scripts/ensure-org-access-field.mjs`

### Debug Scripts
- **List boards in org**: `node scripts/debug/print-boards.mjs <orgUUID>`
- **Show board details**: `node scripts/debug/print-board.mjs <boardUUID>`

### Maintenance Scripts
- **Clear spock area**: `node scripts/maintenance/clear-spock-area.mjs`
- **Version/doc sync**: `node scripts/sync-version.mjs [--check]`

## Environment Variables

- **Required**:
  - `MONGODB_URI` — MongoDB connection string
- **Optional**:
  - `MONGODB_DBNAME` — Database name (default: cardmass)
  - `NEXT_PUBLIC_BASE_URL` — Server-side fetch to self when host headers unavailable
- **Runtime**:
  - Node.js: >= 20.x (LTS)
  - Recommended: Add .nvmrc with Node 20 LTS version

## Authentication & Access Control

**Zero-Trust Model** (MessMass specification):
- **Admin Sessions**: HttpOnly cookie `admin_session` (30-day expiry, SameSite=Lax)
  - Login: `POST /api/auth/login` (email + MD5-hashed password)
  - Logout: `DELETE /api/auth/login`
  - Check: `GET /api/auth/check`
- **Page Passwords**: Per-board 32-hex tokens for non-admin viewers
  - Generate: `POST /api/page-passwords` (admin-only, returns password + shareable link)
  - Validate: `PUT /api/page-passwords` (checks admin session OR page password)
- **Access Rule**: Content accessible IFF (valid admin session) OR (valid page password)
- **UI Components**:
  - `PasswordGate.tsx` — Client-side access control wrapper (3 states: checking/locked/unlocked)
  - Admin bypass: Logged-in admins skip password prompts automatically
  - URL param support: `?pw=<32hex>` auto-validates on page load
- **Server Enforcement**: All protected APIs check admin session OR X-Page-Password headers
- **Security Note**: MD5 hashing is MVP-only (NOT cryptographically secure for production)

## Architecture (Big Picture)
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
