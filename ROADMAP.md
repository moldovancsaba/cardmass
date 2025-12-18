# ROADMAP

Version: 1.3.0

Updated: 2025-12-18T14:52:38.000Z

> Source: consult `HANDBOOK.md` §5 for the authoritative roadmap summary. This file expands each milestone.

## Milestone: v0.22.0 — Documentation Excellence
- Status: ✅ COMPLETED (2025-10-04T18:01:54.000Z)
- Priority: P0

### Items
- ✅ WARP.md comprehensive developer guide with admin scripts and authentication
- ✅ Full documentation audit and synchronization (TECH_STACK, NAMING_GUIDE, README, TASKLIST, ROADMAP)
- ✅ Password reset script fix (MD5 hashing alignment)
- ✅ Version consistency across all documentation files (0.22.0)

## Milestone: Q4 2025
- Dependencies:
  - v0.19.0 docs baseline

### Items
- Automate version/timestamp/doc synchronization (script + pre-commit hook)
  - Owner: ai
  - Priority: P0
  - Expected: 2025-10-15T18:00:00.000Z
  - Notes: Keep ROADMAP/TASKLIST forward-looking and synced; align with timestamp policy.

- Board placements keyed by boardUUID (follow-up)
  - Owner: ai
  - Priority: P0
  - Expected: 2025-10-15T12:00:00.000Z
  - Notes: Migrate boardAreas to be keyed by boardUUID; update API and UI.

- Add .nvmrc (Node 20) and reflect in TECH_STACK.md
  - Owner: csaba
  - Priority: P1
  - Expected: 2025-10-10T16:00:00.000Z

- Maintain and refresh WARP.md based on evolving workflows and scripts
  - Owner: ai
  - Priority: P2
  - Expected: 2025-10-20T12:00:00.000Z
  - Notes: Keep commands/architecture current and aligned with governance (ISO timestamps, version/doc sync).

- Masonry via CSS multicol for Tagger multi-column areas
  - Status: 🚫 DEFERRED (2025-10-04T18:01:54.000Z)
  - Owner: n/a
  - Priority: P3 (previously P0)
  - Notes: User decision to postpone masonry implementation indefinitely. Feature-flagged (ENABLE_MASONRY) approach was planned. Deferred to focus on core features and documentation.

- Zero-Trust Authentication & Access (admin-session + page passwords)
  - Owner: ai
  - Priority: P0
  - Status: ✅ COMPLETED (v0.19.0 - 2025-10-02T12:47:30.000Z)
  - Dependencies: MongoDB users/pagePasswords; cookie settings; Next.js API routes
  - Notes: Based on MessMass AUTHENTICATION_AND_ACCESS; enforce server-side checks; Tagger pages protected; build passes; dev server running
  - Deliverables:
    * Data models: users, pagePasswords collections with indexes
    * Helper libs: src/lib/users.ts, src/lib/auth.ts, src/lib/pagePassword.ts
    * API endpoints: POST/DELETE /api/auth/login, GET /api/auth/check, POST/PUT /api/page-passwords
    * UI components: PasswordGate.tsx, TaggerWithAuth.tsx
    * TaggerApp: 19 fetch calls updated with auth headers
    * Server enforcement: all boards/cards APIs with scope=tagger or X-Page-* headers
    * Operational scripts: create-user.mjs, update-password.mjs, test-login.mjs
    * Admin user created: admin@doneisbetter.com (super-admin)
